#!/usr/bin/env bash
# Runs on the server, sent by .github/workflows/deploy.yml over ssh:
#
#   bash -c "<this file>" deploy <repo> <image tag> <registry user> <branch> [swarm addr]
#
# Its stdin carries what must never be on a command line or on disk:
#   line 1     the job's GITHUB_TOKEN, to pull the image from ghcr.io
#   the rest   the app's values from the KF console (`kf ci secrets --runtime`):
#              KEY=value lines, ending with "# kf: end"
#
# The values stay in this shell's memory; nothing here writes them to a file.
# Docker gets them as the environment of `docker stack deploy`: a second
# compose file, made here and piped in on docker's stdin, lists every key's
# name, with no value, for each service that used to read infra/.env, and the
# docker CLI fills each from its own environment. stack.yml comes after it, so
# a value stack.yml sets (NODE_ENV, PORT, CLOUDAMQP_URL…) still wins, as it
# did over the env_file. Swarm then keeps the values in each service's spec,
# which is how it passes environment to a container: `docker service inspect`
# on this host shows them to anyone with Docker here.
set -euo pipefail

REPO="${1:?missing repo}"
IMAGE_TAG="${2:?missing image tag}"
REGISTRY_USER="${3:?missing registry user}"
BRANCH="${4:-main}"
SWARM_ADDR="${5:-}"

STACK_NAME=pubpub
# The services that read infra/.env before. The proxy (Caddy) never used any
# of it, so it no longer gets the app's values.
APP_SERVICES=(app worker cron pubstash)

# --- stdin: the registry token, then the values, all of it before anything else runs
IFS= read -r REGISTRY_TOKEN || {
	echo "no registry token on stdin" >&2
	exit 1
}
[[ -n "$REGISTRY_TOKEN" ]] || {
	echo "no registry token on stdin" >&2
	exit 1
}

declare -A VALUES=()
NAMES=()
complete=0
while IFS= read -r line; do
	if [[ "$line" == "# kf: end" ]]; then
		complete=1
		break
	fi
	[[ -z "$line" || "$line" == \#* ]] && continue
	key="${line%%=*}"
	if [[ "$line" != *=* || ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
		echo "a line from kf is not KEY=value; nothing deployed" >&2
		exit 1
	fi
	# Names the shell, sudo, the dynamic loader or the docker CLI read for their
	# own behaviour, and the two stack.yml interpolates, are never the app's.
	case "${key^^}" in
		DOCKER_* | LD_* | SUDO_* | BASH_* | PATH | HOME | ENV | IFS | SHELLOPTS | PS4 | \
			HTTP_PROXY | HTTPS_PROXY | ALL_PROXY | NO_PROXY | IMAGE_TAG | APP_COMMIT)
			echo "$key is a name the deploy itself reads; nothing deployed" >&2
			exit 1
			;;
	esac
	if [[ -n "${VALUES[$key]+set}" ]]; then
		echo "$key came twice from kf; nothing deployed" >&2
		exit 1
	fi
	VALUES["$key"]="${line#*=}"
	NAMES+=("$key")
done
if [[ "$complete" != 1 ]]; then
	echo "the values from kf were cut short; nothing deployed" >&2
	exit 1
fi
if [[ "${#NAMES[@]}" == 0 ]]; then
	echo "no values from kf; nothing deployed" >&2
	exit 1
fi
# Nothing after this reads the job's stdin.
exec </dev/null
echo "values for the app: ${NAMES[*]}"

# The second compose file: names only, quoted so YAML reads each as a string.
names_yaml() {
	local svc k list=""
	for k in "${NAMES[@]}"; do list+="\"$k\", "; done
	list="[${list%, }]"
	echo "services:"
	for svc in "${APP_SERVICES[@]}"; do
		echo "  ${svc}:"
		echo "    environment: ${list}"
	done
}

# --- the checkout: stack.yml and the Caddyfile at the commit being deployed
APP_DIR="${APP_ROOT:-/srv}/${REPO##*/}"
REPO_SSH="git@github.com:${REPO}.git"

ssh-keyscan -H github.com >>~/.ssh/known_hosts 2>/dev/null
chmod 600 ~/.ssh/known_hosts

if [[ ! -d "${APP_DIR}/.git" ]]; then
	sudo mkdir -p "${APP_DIR}"
	sudo chown -R "$USER:$USER" "${APP_DIR}"
	git clone --branch "${BRANCH}" "${REPO_SSH}" "${APP_DIR}"
fi

cd "${APP_DIR}"
git fetch --prune --tags origin
git checkout --detach "${IMAGE_TAG}"
APP_COMMIT="$(git rev-parse HEAD)"
if [[ -z "$APP_COMMIT" ]]; then
	echo "Unable to resolve APP_COMMIT from IMAGE_TAG='${IMAGE_TAG}'" >&2
	exit 1
fi

cd infra
# The plaintext .env earlier deploys decrypted here with the server's age key.
# Nothing reads it now.
rm -f .env

# --- swarm, registry, image
# one-time / idempotent
if ! sudo docker info --format '{{.Swarm.LocalNodeState}}' | grep -qx active; then
	if [[ -z "$SWARM_ADDR" ]]; then
		echo "swarm is not active here, and the GitHub Environment has no SWARM_ADDR variable" >&2
		exit 1
	fi
	sudo docker swarm init --advertise-addr "$SWARM_ADDR"
fi

printf '%s\n' "$REGISTRY_TOKEN" | sudo docker login ghcr.io -u "$REGISTRY_USER" --password-stdin
# The job's token expires with the job; nothing needs it stored. This also
# removes the long-lived token earlier deploys logged in with.
trap 'sudo docker logout ghcr.io >/dev/null 2>&1 || true' EXIT

echo "IMAGE_TAG in shell: [$IMAGE_TAG]"
echo "APP_COMMIT in shell: [$APP_COMMIT]"

# Reclaim disk BEFORE the pull and the rollout, never during it.
#
# This used to run immediately after `docker stack deploy`, which is the
# worst possible moment. The rolling update is still in flight there, so
# the prune raced Swarm's own containers, and any task that had already
# exited had its container -- and therefore its logs -- deleted before
# anyone could read them. It also meant the big image pull happened while
# the disk was still full, on a box with a history of disk pressure.
echo "--- disk before cleanup ---"
df -h /var/lib/docker 2>/dev/null || df -h /
sudo docker container prune -f
sudo docker image prune -a --filter "until=72h" -f
echo "--- disk after cleanup ---"
df -h /var/lib/docker 2>/dev/null || df -h /

# For some reason, not pulling explicitly makes the docker stack deploy throw an error that it can't find the package.
sudo docker pull "ghcr.io/${REPO}:${IMAGE_TAG}"

# --- deploy/update stack: the values in the docker CLI's environment only,
# in a subshell so they are in no other command's.
deploy_stack() (
	local k
	for k in "${NAMES[@]}"; do export "$k=${VALUES[$k]}"; done
	export IMAGE_TAG APP_COMMIT
	keep="$(
		IFS=,
		echo "IMAGE_TAG,APP_COMMIT,${NAMES[*]}"
	)"
	names_yaml | sudo --preserve-env="$keep" docker stack deploy \
		-c - -c stack.yml --with-registry-auth --resolve-image always --prune "$STACK_NAME"
)
deploy_stack

# show progress
sudo docker stack services "$STACK_NAME"

# Dump everything needed to diagnose a failed rollout. Tasks that exit
# during an update are short-lived and their containers are gone soon
# after, so the only reliable moment to read them is right now, in the
# job that just watched them fail.
dump_rollout_failure() {
	svc="$1"
	echo "--- $svc update status ---"
	sudo docker service inspect "$svc" --format '{{json .UpdateStatus}}' 2>/dev/null || true
	echo "--- $svc tasks ---"
	sudo docker service ps "$svc" --no-trunc 2>/dev/null || true
	echo "--- $svc service logs (last 200 lines, all tasks) ---"
	sudo docker service logs "$svc" --timestamps --tail 200 2>&1 || true
	echo "--- logs for tasks that are not Running ---"
	sudo docker service ps "$svc" --no-trunc --format '{{.ID}} {{.CurrentState}}' 2>/dev/null |
		awk '$2 != "Running" { print $1 }' |
		head -5 |
		while read -r task; do
			echo "--- task $task ---"
			sudo docker service logs "$task" --timestamps --tail 100 2>&1 || true
		done
	echo "--- disk ---"
	df -h /var/lib/docker 2>/dev/null || df -h /
}

# wait until rollout is complete
wait_rollout() {
	echo "Beginning wait for rollout..."
	svc="$1"
	timeout="${2:-600}"
	end=$((SECONDS + timeout))

	while ((SECONDS < end)); do
		desired="$(sudo docker service inspect "$svc" --format '{{.Spec.Mode.Replicated.Replicas}}' 2>/dev/null || echo "")"
		running="$(sudo docker service ps "$svc" --filter desired-state=running --format '{{.CurrentState}}' 2>/dev/null | grep -c '^Running' || true)"
		state="$(sudo docker service inspect "$svc" --format '{{if .UpdateStatus}}{{.UpdateStatus.State}}{{end}}' 2>/dev/null || echo "")"
		echo "  $svc: desired=$desired running=$running state=$state"

		# Terminal failure states. Swarm has already given up and reverted, so
		# polling on until the timeout only buries the reason under 600s of
		# identical lines -- and `desired == running` stays true throughout,
		# because the OLD tasks are healthy.
		case "$state" in
			rollback_completed | rollback_started | rollback_paused | paused)
				echo "::error::$svc update failed (state=$state) -- Swarm reverted to the previous version. The new image is NOT deployed."
				dump_rollout_failure "$svc"
				return 1
				;;
		esac

		if [[ -n "$desired" && "$running" == "$desired" ]] && { [[ -z "$state" ]] || [[ "$state" == "completed" ]]; }; then
			echo "  $svc rollout complete"
			return 0
		fi

		sleep 5
	done

	echo "::error::Rollout timeout for $svc after ${timeout}s"
	dump_rollout_failure "$svc"
	return 1
}

wait_rollout pubpub_app 600
wait_rollout pubpub_worker 300
wait_rollout pubpub_pubstash 300
wait_rollout pubpub_cron 300

echo "Deployed ${STACK_NAME} @ ${IMAGE_TAG} (${APP_COMMIT}) to $(hostname)"

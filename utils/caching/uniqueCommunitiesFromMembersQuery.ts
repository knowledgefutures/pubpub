export const uniqueCommunitiesFromMembersQuery = `
SELECT
    subdomain,
    domain
from
    "Communities"
INNER JOIN (
    SELECT DISTINCT
        "communityId"
    FROM
        "Members"
    WHERE
        "userId" = :userId
        AND "communityId" IS NOT NULL

    UNION

    SELECT DISTINCT
        "Pubs"."communityId"
    FROM
        "Pubs"
        INNER JOIN "Members" ON "Pubs"."id" = "Members"."pubId"
    WHERE
        "Members"."userId" = :userId
        AND "Pubs"."communityId" IS NOT NULL

    UNION

    SELECT DISTINCT
        "Collections"."communityId"
    FROM
        "Collections"
        INNER JOIN "Members" ON "Collections"."id" = "Members"."collectionId"
    WHERE
        "Members"."userId" = :userId
        AND "Collections"."communityId" IS NOT NULL

    UNION

    SELECT DISTINCT
        "Collections"."communityId"
    FROM
        "Collections"
        INNER JOIN "CollectionAttributions" ON "Collections"."id" = "CollectionAttributions"."collectionId"
    WHERE
        "CollectionAttributions"."userId" = :userId
        AND "Collections"."communityId" IS NOT NULL

    UNION

    SELECT DISTINCT
        "Pubs"."communityId"
    FROM
        "Pubs"
        INNER JOIN "PubAttributions" ON "Pubs"."id" = "PubAttributions"."pubId"
    WHERE
        "PubAttributions"."userId" = :userId
        AND "Pubs"."communityId" IS NOT NULL
) AS "UniqueCommunities" ON "Communities"."id" = "UniqueCommunities"."communityId"
` as const;

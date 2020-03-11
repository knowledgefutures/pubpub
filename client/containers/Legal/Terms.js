import React, { useState } from 'react';
import { Button, Dialog, Classes } from '@blueprintjs/core';
import PropTypes from 'prop-types';

const propTypes = {
	hostname: PropTypes.string.isRequired,
};

const Terms = function(props) {
	const [isOpen, setOpen] = useState(false);
	const toggleOverlay = (e) => {
		e.preventDefault();
		setOpen(!isOpen);
	};
	return (
		<div>
			<h2>Terms of Service</h2>
			<p>
				PubPub is an end-to-end, open-source publishing platform developed at the
				Massachusetts Institute of Technology (“MIT”) and operationalized under the auspices
				of the Knowledge Futures Group (KFG). KFG, established in 2018, is a community of
				technologists, information creators, and scholarly publishers that is committed to
				addressing a core set of pressing and complex issues within research-intensive
				institutions. PubPub’s goal is to develop open tools, infrastructure, and
				transparent business models that will bend the arc of knowledge creation and
				consumption toward equity and independence. PubPub operates on servers located,
				administered, and maintained in the United States in accordance with U.S. federal
				and state laws. PubPub operates as a non-commercial, non-profit public interest
				publishing platform.
			</p>
			<p>
				PubPub reserves the right to change the provisions of these Terms of Service and to
				modify PubPub’s features at any time. The PubPub website will post changes to these
				Terms of Service at{' '}
				<a
					href={`https://${props.hostname}/legal/terms`}
				>{`${props.hostname}/legal/terms`}</a>
				, and all registered users will receive email notification that changes have been
				made. Posted changes will become effective automatically 15 days after they are
				posted, except that if any amendments thereto are made after posting, such
				amendments will become effective 15 days after they are made. By accessing the
				PubPub website after modifications to these Terms of Service have become effective,
				you agree to be bound by all the modified terms. All references herein to “these
				Terms of Service” shall be construed to include all modifications becoming effective
				at any time hereafter.
			</p>
			<p>
				The terms “PubPub,” “we”, “us”, “our”, and other similar terms as used in these
				Terms of Service include MIT and KFG as the owners and operators of PubPub, and all
				of their agents, employees, contractors, and other affiliated persons engaged in
				such activity.
			</p>
			<h3>Acceptance of Terms</h3>
			<p>
				By accessing content on the PubPub website (the “Site,” which includes all pages
				within the pubpub.org host directory and subdomains, all pages and other content
				hosted on PubPub servers regardless of domain, and all associated services),
			</p>
			<ol>
				<li>You accept and agree to be bound by all of these Terms of Service; and</li>
				<li>You represent and warrant that you are 13 years of age or older.</li>
			</ol>
			<p>
				If we discover or have any reason to suspect that you are under the age of 13, we
				will suspend or terminate your registration to this Site immediately and without
				notice.
			</p>
			<h3>Third-Party Publishers</h3>
			<p>
				The Site provides hosting services to other persons and organizations for the
				publication of journals, books, or other curated content. Such persons and entities
				are referred to in these Terms of Service as “Third-Party Publishers.”
			</p>
			<h3>Communities</h3>
			<p>
				PubPub allows registered users to create a "Community", a publicly available site on
				PubPub where common disciplinary interests aggregate around content contributed by
				creators and readers. A Community may reside on the PubPub domain or on a domain of
				the Community administrator's choice but displayed from a PubPub server. You may
				submit your Content for inclusion in a Community, but it is up to the Community’s
				administrator to decide whether to include it. PubPub may display in your profile a
				list of your Content and the Communities in which they appear. We may also send you
				a notification each time a Community has elected to include your Content, if you
				have opted in to receiving email from PubPub. The term “Community” as used herein
				will include its administrators and contributors.
			</p>
			<h3>Use of the Site</h3>
			<p>
				For the purposes of these Terms of Service, the term “Site Content” shall include
				all content, features, and functionality posted to the Site, including journals,
				books, and other publications created by third parties (“Third-Party Content”), all
				User-Generated Content, and all content at any time transmitted through or by means
				of the Site.
			</p>
			<p>
				Except where otherwise noted, Site Content is licensed under the{' '}
				<a href="https://creativecommons.org/licenses/by/4.0/">
					Creative Commons Attribution (CC-BY) 4.0 License
				</a>{' '}
				and may be used under the terms of that license or any later version of a Creative
				Commons Attribution License.
			</p>
			<p>
				You acknowledge that PubPub may establish general practices and limits concerning
				use of the Site, including without limitation the maximum period of time that
				content will be retained on the Site. You agree that we have no responsibility or
				liability for the deletion or failure to store any content. You further acknowledge
				that PubPub reserves the right to change these general practices and limits at any
				time, in PubPub’s sole discretion. PubPub will endeavor to give notice of any such
				change where required by applicable law.
			</p>
			<h3>Third-Party Sites and Resources</h3>
			<p>
				The Site may provide or facilitate, or third parties may provide, links or other
				access to other sites and resources on the Internet. We have no control over such
				sites and resources, are not responsible for them, and do not endorse them. You
				acknowledge and agree that we will not be responsible or liable, directly or
				indirectly, for any damage or loss caused or alleged to be caused by or in
				connection with your use of or reliance on any content available on or through any
				such site or resource.
			</p>
			<h3>PubPub and Personal Information</h3>
			<p>
				PubPub defines Personal Information to be i) any information from or about you that
				identifies you directly – such as your name, email address, device identifier,
				photograph, and cookies or other automated information collection technology that
				can be used to identify you – and ii) any information that is associated with you
				and thus could potentially be used to identify or reidentify you, including when
				combined with other information from or about you. For the avoidance of doubt,
				PubPub defines Personal Information broadly, and the definition includes “personal
				data” and “special categories of personal data” as those terms are used in the EU
				General Data Protection Regulation and “personal information” as used in the
				California Consumer Protection Act.
			</p>
			<p>
				Personal Information does not include information that has been aggregated,
				excerpted, anonymized, or otherwise deidentified to the point at which an individual
				can no longer be identified or reidentified using reasonable efforts, technology,
				and resources (“Non-Personal Information”). Personal Information also does not
				include contact information that is routinely made available in a professional
				capacity to facilitate business and professional communications, such as the
				information ordinarily found on a business card, website profile, or CV, when used
				solely for purposes of professional and business communications (“Business Contact
				Information”).
			</p>
			<p>
				Except with respect to Personal Information that you post directly to the Site in a
				manner that makes it visible to other users:
			</p>
			<ol>
				<li>
					PubPub collects the minimum amount of Personal Information necessary to operate
					the Site, including with regard to registration, log-in information, and the use
					of cookies and any other automated collection technologies that facilitate
					operation, use, and security of the Site (“Site Operations”). PubPub maintains
					Personal Information only as long as is necessary for Site Operations and to
					comply with PubPub’s legal and business obligations.
				</li>
				<li>
					PubPub shares Personal Information with Third-Party Publishers only to the
					extent necessary to permit each Third-Party Publisher to interact with the
					individuals who access its own content on the Site and to comply with each
					Third-Party Publishers’ legal and business obligations.
				</li>
				<li>
					PubPub does not share Personal Information with third-party service providers,
					or with employees or agents of MIT of KFG not directly engaged in PubPub, except
					to the extent necessary for Site Operations and to comply with their legal and
					business obligations. MIT and KFG will not use, and third-party service
					providers are not authorized to use, Personal Information they receive from
					PubPub for their own marketing or other purposes not related to PubPub. PubPub
					retains control over and responsibility for the Personal Information that it
					shares with employees and agents of MIT and KFG, and with third-party service
					providers.
				</li>
				<li>
					PubPub is accessible to all interested entities and individuals who have
					internet access. PubPub does not in any way target, market to, profile, or
					otherwise track individuals within a particular jurisdiction.
				</li>
				<li>
					PubPub maintains reasonable administrative, technical, and physical controls to
					protect Personal Information against unauthorized access, use, sharing,
					retention, and disposal.{' '}
				</li>
				<li>
					PubPub operates the Site in accordance with all applicable U.S. privacy and data
					security laws.
				</li>
				<li>
					Users who no longer wish to have PubPub retain or use their Personal Information
					can contact PubPub at{' '}
					<a href="mailto:help@pubpub.org?subject=Personal%20Info%20Deletion%20Request">
						help@pubpub.org
					</a>
					. PubPub will, to the extent feasible and consistent with Site Operations,
					delete Personal Information upon request and notify third-party service
					providers and relevant Third-Party Publishers of the request.
				</li>
				<li>
					To the extent that PubPub experiences suspected or actual unauthorized access,
					use, or sharing of Personal Information, a compromise of the Site or its
					accessibility, or a suspected or actual violation of these Terms of Service,
					PubPub will promptly notify the affected Third-Party Publishers and, to the
					extent appropriate and in accordance with applicable law, affected users.
				</li>
				<li>
					For additional information about PubPub’s collection, use, and sharing of
					Personal Information, including questions about policies and practices and
					requests regarding your Personal Information, please contact us at{' '}
					<a href="mailto:help@pubpub.org?subject=Personal%20Info%20Policy%20Question">
						help@pubpub.org
					</a>
					.
				</li>
			</ol>
			<h3>User-Generated Content</h3>
			<p>
				The Site includes features that support and publish User-Generated Content. The term
				“User-Generated Content,” for purposes of these Terms of Service, means any content,
				whether or not copyrightable, that users submit to the Site. The Site, Third Party
				Publishers, and Communities may solicit and publish User-Generated Content through
				blogs, video postings, and chat features, among other forums. You shall not make use
				of these features:
			</p>
			<ul>
				<li>
					To make comments that are threatening, knowingly false, or unlawful; or to
					engage in or promote harassment, hate, violence, discrimination or personal
					attacks;
				</li>
				<li>
					To impersonate any person or entity or create a false identity (other than a
					pseudonym) on the Site;
				</li>
				<li>
					To harass, threaten, stalk, embarrass or cause distress, unwanted attention or
					discomfort to any user of the Site;
				</li>
				<li>
					To disseminate or transmit “spam,” unsolicited messages, chain letters,
					advertisements, solicitations, or other unsolicited commercial communications,
					including (but not limited to) communications describing investment
					opportunities;
				</li>
				<li>
					To post material that infringes a copyright, trademark or patent right, trade
					secret or other legal right of any person or any corporation, institution, or
					other entity;
				</li>
				<li>
					To knowingly disseminate or transmit viruses, Trojan horses, worms, defects,
					date bombs, time bombs, malware, ransomware, spyware, or other items of a
					destructive nature or any other malicious code or program;
				</li>
				<li>
					To knowingly carry out any action with the intent or effect of disrupting other
					users’ experience of the Site, such as intentionally causing a chat screen to
					scroll faster than other users are able to read, or deploying macros with large
					amounts of text for the purpose of disrupting the normal flow of user chats.
				</li>
			</ul>
			<p>
				You are responsible for any User-Generated Content you provide. By submitting
				User-Generated Content, you represent and warrant to us and to all Third-Party
				Publishers and Communities that such content:
			</p>
			<ul>
				<li>
					whether created by you or by other persons, does not breach or conflict with any
					obligation, such as a confidentiality obligation or use restriction, does not
					violate or infringe upon the rights of any third party, including copyright,
					trademark, privacy, publicity, or other personal or proprietary rights, and does
					not contain libelous, defamatory, or otherwise unlawful material;
				</li>
				<li>
					if created by you, is (i) automatically licensed under the Creative Commons
					referred to above or any alternative Creative Commons license you select at the
					time of submission, and may be used under the terms of that license or any later
					version of that license, or (ii in the public domain (such as Content that is
					not copyrightable, or Content you make available under CC0);
				</li>
				<li>
					if created by someone else and not in the public domain, (i) is available under
					the Creative Commons license you select for the Content or (ii) is Content that
					you are authorized by law (including but not limited to the doctrine of fair
					use) to post on the Site, and in either case, (iii) is prominently marked as
					being subject to third-party copyright.
				</li>
			</ul>
			<p>
				All of your User-Generated Content must be appropriately marked with licensing and
				attribution information.
			</p>
			<p>
				You acknowledge that you will receive no compensation for the posting of
				User-Generated content.
			</p>
			<p>
				If you post any Content that contains Personal Information – your own or that of
				another individual – your posting is presumed to be voluntary and authorized. Your
				posting of Personal Information and other content is at your own risk. Neither we
				nor any Third Party Publisher or Community will have any liability for any use or
				misuse by any other person of such Personal Information, or any alleged alteration
				or distortion of such Personal Information on the Site. If you wish to remove from
				the Site any Personal Information that you have posted, or if you assert that
				Personal Information you have posted has been distorted or altered in any way on the
				Site, your sole remedy will be to request the removal of such Personal Information,
				identified by you with particularity so that it may be easily found, but we will not
				be liable for any failure to act on your request. To make a removal request, contact
				us at{' '}
				<a href="mailto:help@pubpub.org?subject=Content%20Removal%20Request">
					help@pubpub.org
				</a>
				.
			</p>
			<p>
				You acknowledge and accept that User-Generated Content posted to the Site may in our
				discretion be made available to the public on a perpetual basis to use in accordance
				with these Terms of Use.
			</p>
			<p>We, and any Third-Party Publisher or Community,</p>
			<ul>
				<li>may monitor User-Generated Content on the Site,</li>
				<li>
					may modify, edit, or remove any of said content at our or their discretion,
					without notice, and for any reason,
				</li>
				<li>
					may prescreen User-Generated Content and may decide, in our or their discretion,
					without notice, and for any reason, not to publish it,
				</li>
				<li>
					will not modify or edit any scholarly work that you submit for posting on the
					Site, but may decide, in our or their discretion, to withhold it from
					publication in its entirety, and
				</li>
				<li>
					will have no liability for monitoring, modifying, removing, or declining to
					publish User-Generated Content on the Site.
				</li>
			</ul>
			<p>
				You acknowledge and accept that the views and opinions expressed by other users on
				the Site are theirs alone and should not be ascribed to us. User-Generated Content
				and Third-Party Content are the sole responsibility of the users or third parties
				that created them, and their accuracy and completeness are not endorsed or
				guaranteed by us. You understand that by using the Site, you may be exposed to
				User-Generated Content that might be offensive, harmful, inaccurate or otherwise
				inappropriate. Under no circumstances will we or any Third-Party Publisher or
				Community be liable in any way for any User-Generated Content, including, but not
				limited to, any errors or omissions in any User-Generated Content, or any loss or
				damage of any kind incurred as a result of the use of any User-Generated Content
				made available via the Site or disseminated elsewhere.
			</p>
			<h3>Intellectual Property</h3>
			<p>
				You acknowledge and agree that Site Content may contain content protected by
				copyright, trademark, or other proprietary rights and laws, and you agree to respect
				and comply with such rights and laws.
			</p>
			<p>
				Without limitation of the foregoing, “MIT,” “Massachusetts Institute of Technology,”
				“PubPub,” the PubPub logo, and the names of Third-Party Publishers and their logos,
				are proprietary trademarks and service marks and may not be used without the prior
				written consent of the holder of the name, trademark, logo or insignia, which
				consent any holder may withhold in its sole discretion. Nothing in these Terms of
				Service or the Site should be construed as granting, by implication, estoppel, or
				otherwise, any license or right to use any of trademarks, without prior written
				permission of the holder in each instance. All goodwill generated from the use of
				trademarks will inure to the exclusive benefit of the holder of such trademarks.
			</p>
			<p>
				If you believe that any content on the Site infringes your copyright, please{' '}
				<Button
					minimal={true}
					onClick={toggleOverlay}
					style={{
						margin: 0,
						padding: 0,
						textDecoration: 'underline',
						verticalAlign: 'baseline',
						minHeight: 'inherit',
					}}
				>
					click here for more information
				</Button>
				<Dialog isOpen={isOpen} onClose={toggleOverlay} title="DMCA Agent Information">
					<p className={Classes.DIALOG_BODY}>
						PubPub DMCA Agent
						<br />
						c/o Yarn Labs, Inc.
						<br />
						245 Main street
						<br />
						Floor 2<br />
						Cambridge, MA 02142
						<br />
						Email: <a href="mailto:dmca@pubpub.org">dmca@pubpub.org</a>
					</p>
				</Dialog>
				, including the email address for our DMCA agent, to whom copyright infringement
				notifications should be sent. 
			</p>
			<h3>Prohibited Uses of the Site</h3>
			<p>
				You may not access or use the Site in any manner that could damage or overburden any
				MIT server, or any network connected to any MIT server. You may not use the Site in
				any manner that would interfere with any other party’s use of the Site. If you are
				blocked by us from accessing the Site (including by blocking your IP address), you
				agree not to implement any measures to circumvent such blocking (e.g., by masking
				your IP address or using a proxy IP address). Any use of the Site or the Site’s
				content other than as specifically authorized herein is strictly prohibited.
			</p>
			<h3>Registration and Termination of Access</h3>
			<p>
				Certain areas of the Site may require registration or may otherwise ask you to
				provide information in order to participate. The decision to provide this
				information is optional; however, if you elect not to provide such information, you
				may not be able to access certain content, features, or functionalities. When you
				register, you must provide information to PubPub that is accurate, current and
				complete (excepting the use of a pseudonym). You agree to immediately notify PubPub
				of any unauthorized use of your password or any other breach of security. We will
				not be liable for any loss or damage arising from your failure to protect your
				password or account login information.
			</p>
			<p>
				We reserve the right to terminate any registration and otherwise deny Site access to
				any person for any reason. Any suspected fraudulent, abusive or illegal activity
				that may be grounds for suspension or termination of your account and/or use of the
				Site, may be referred to appropriate law enforcement authorities. You agree that any
				termination of your account and/or access to the Site under any provision of these
				Terms of Service may be effected without prior notice, and acknowledge and agree
				that we may immediately deactivate or delete all related information and/or bar any
				further access to the Site. Further, you agree that we will not be liable to you or
				any third party for any termination of your account and/or access to the Site.
			</p>
			<h3>Disclaimer of Warranty / Limitation of Liability</h3>
			<p>
				Your use of the Site is at your sole risk. TO THE FULLEST EXTENT PERMITTED BY THE
				LAW, WE AND ALL THIRD-PARTY PUBLISHERS AND COMMUNITIES (COLLECTIVELY, “THE
				DISCLAIMING PARTIES”) DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION
				WITH THE SITE AND YOUR USE THEREOF, INCLUDING BUT NOT LIMITED TO WARRANTIES AS TO
				THE ACCURACY OR COMPLETENESS OF SITE CONTENT AND WARRANTIES OF MERCHANTABILITY,
				FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR NON-INFRINGEMENT. Without limitation of
				the foregoing, you assume all risk, and the Disclaiming Parties shall have no
				liability or responsibility, for any (1) errors, or omissions in Site Content; (2)
				personal injury, property damage, or other personal or business loss, of any nature
				whatsoever, resulting from your access to and use of the Site or Site Content; (3)
				unauthorized access to or use by any third party of the Site or MIT’s secure servers
				and/or any and all personal information and/or financial information stored therein;
				(4) interruption or cessation of transmission to or from the Site, or failure of the
				Site to meet any particular standard of quality, function, or performance; (5) bugs,
				viruses, Trojan horses, or the like that may be transmitted to or through the Site
				by any third party; and/or (6) any use or misuse of your User-Generated Content by
				third parties (“Loss Events”).
			</p>
			<p>
				You agree that the Disclaiming Parties will not be liable to you for any loss or
				damages, either actual or consequential, arising out of or relating to these terms,
				or your (or any third-party’s) use or inability to use the Site, or your placement
				of User-Generated Content on the Site, or your reliance upon information obtained
				from or through the Site, or your communications with other users of the Site. The
				Disclaiming Parties will have no liability for any consequential, indirect,
				punitive, special or incidental damages, even if they have been advised of the
				possibility of such damages (including, but not limited to, claims for defamation,
				errors, loss of data, or interruption in availability of data), arising out of or
				relating to your use of or inability to use the Site, or any other person’s use of
				the Site, whether based in contract, tort, or other law, including but not limited
				to injury or loss arising out of any Loss Event described above.
			</p>
			<h3>Indemnification</h3>
			<p>
				You will indemnify and defend us, each Third Party Publisher, each Community, and
				each of our or their affiliates, employees, faculty members, fellows, students,
				governing board members, contractors and agents (collectively, the “Indemnified
				Parties”), and hold the Indemnified Parties harmless, from and against any claim,
				and all related loss, damage, damage, or expense, including without limitation
				reasonable attorneys’ fees, incurred by Indemnified Parties, in connection (1) use
				of the Site; (2) posting of User-Generated Content; (3) breach of these Terms of
				Service or any representation or warranty made by you; or (4) violation of
				applicable law, by you or by any person whom you authorize to use your PubPub
				account.
			</p>
			<p>
				You shall cooperate as reasonably required in the defense of any such claim. The
				Indemnified Parties shall have the right, at their own expense, to assume the
				exclusive defense and control of any matter subject to indemnification by you.
			</p>
			<h3>Third-Party Beneficiaries</h3>
			<p>
				All Third-Party Publishers and Communities are third-party beneficiaries of these
				Terms of Service, to the extent their interests may appear, and may enforce the
				provisions of these Terms of Service directly. Third-Party Publishers and
				Communities may assign or transfer these Terms of Service, as applicable to their
				relationship with you, without restriction, as part of any assignment of any
				Community or Third-Party Content, in whole or in part, to any other publisher or
				platform, and such Terms of Service will be binding on and inure to the benefit of
				their successors and assigns.
			</p>
			<h3>General</h3>
			<p>
				These Terms of Service constitute the entire agreement between you and us with
				respect to your use of the Site, superseding any prior agreements. The section
				titles in these Terms of Service are for convenience only and have no legal or
				contractual effect.
			</p>
			<p>
				If PubPub should cease to operate, or if these Terms of Service are for any reason
				discontinued, these Terms of Service will continue to apply to any act or omission
				occurring while they were in force. Without limitation of the foregoing, the
				provisions of the “Disclaimer of Warranty / Limitation of Liability” and
				“Indemnification” sections hereof will survive any termination of PubPub or of these
				Terms of Service.
			</p>
			<p>
				These Terms of Service will be governed by the laws of the Commonwealth of
				Massachusetts without regard to its conflicts of laws provisions. In the case of any
				dispute arising out of these Terms of Service or your use of the Site, the state and
				federal courts located within the Commonwealth of Massachusetts will have exclusive
				jurisdiction, and you agree to submit to the personal jurisdiction of such courts.
			</p>
			<p>
				Any failure to exercise or enforce any right or provision of these Terms of Service
				will not constitute a waiver of such right or provision. If any provision of these
				Terms of Service is found by a court of competent jurisdiction to be invalid, it
				shall be interpreted in such manner as to have the broadest validity consistent with
				law, and the other provisions of these Terms of Service shall remain in full force
				and effect.{' '}
			</p>
			<p>
				You agree that regardless of any statute or law to the contrary, any claim or cause
				of action by you arising out of or related to use of the Site or these Terms of
				Service must be filed within one (1) year after such claim or cause of action arose
				or be forever barred.{' '}
			</p>
			<p>
				A printed version of this agreement and of any notice given in electronic form will
				be admissible in judicial or administrative proceedings based upon or relating to
				this agreement to the same extent and subject to the same conditions as other
				business documents and records originally generated and maintained in printed form.{' '}
			</p>
			<p>
				These Terms of Service are personal to you and non-assignable, except that they will
				be binding on any employer or other person or entity on whose behalf you may use the
				Site, except to the extent inconsistent with any direct agreement we may have with
				such person or entity. PubPub may assign or transfer these Terms of Service and your
				agreement thereto, in whole or in part, without restriction, as part of any
				assignment of PubPub in whole or in part. These Terms of Service will be binding on,
				and inure to the benefit of, our successors and assigns and your heirs and personal
				representatives.
			</p>
			<h3>Questions and Comments</h3>
			<p>
				If you have any questions about these Terms of Service, our privacy practices and
				work with Personal Information, the practices of the Site, or your dealings with
				this Site, please contact{' '}
				<a href="mailto:help@pubpub.org?subject=Terms%20Question">help@pubpub.org</a>.
			</p>
			<h3>Effective Date of Agreement</h3>
			<p>
				The effective date of the current version of these Terms of Service is January 30,
				2020.
			</p>
		</div>
	);
};

Terms.propTypes = propTypes;
export default Terms;

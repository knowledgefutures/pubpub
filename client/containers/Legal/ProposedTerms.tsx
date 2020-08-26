import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
	hostname: PropTypes.string.isRequired,
};

const ProposedTerms = function(props) {
	return (
		<div>
			<h2>Proposed Terms of Service</h2>
			<p>
				PubPub is an end-to-end, open-source publishing platform developed by Knowledge
				Futures, Inc (KFI). KFI is a community of technologists, information creators, and
				scholarly publishers that is committed to addressing a core set of pressing and
				complex issues within research-intensive institutions. PubPub’s goal is to develop
				open tools, infrastructure, and transparent business models that will bend the arc
				of knowledge creation and consumption toward equity and independence.
			</p>
			<p>
				This is a legal agreement between us, Knowledge Futures, Inc., a Massachusetts
				nonprofit organization with offices at 245 Main St, Cambridge MA, and you.
			</p>
			<p>
				By accessing the PubPub website after those changes have become effective, you agree
				to be bound by all the modified terms.
			</p>
			<p>
				BY ACCESSING CONTENT ON THE PUBPUB WEBSITE, YOU ACCEPT THESE TERMS OF SERVICE. If
				you are using PubPub on behalf of an entity, “you” refers to that entity.
			</p>
			<h3>Communities</h3>
			<p>
				PubPub allows registered users to create a Community. A Community may reside on the
				PubPub domain or on a domain of the Community administrator&#x27;s choice but
				displayed from a PubPub server. You may submit your Content for inclusion in a
				Community, but it is up to the discretion of the Community’s administrator to decide
				whether to include it. PubPub may display in your profile a list of your Content and
				the Communities in which they appear. We may also send you a notification each time
				a Community has elected to include your Content, if you have opted in to receiving
				email from PubPub.
			</p>
			<h3>Site Content</h3>
			<p>
				Except where otherwise noted, Site Content is licensed by its owners under the 
				<a href="https://creativecommons.org/licenses/by/4.0/" title="">
					Creative Commons Attribution (CC-BY) 4.0 License
				</a>
				.
			</p>
			<h3>Acceptable Use</h3>
			<p>
				We may establish written policies for your use of the Site, and those policies will
				be published at{' '}
				<a
					href={`https://${props.hostname}/legal/proposed-aup`}
				>{`${props.hostname}/legal/proposed-aup`}</a>
				. You must abide by those policies, and if you fail to do so, we may immediately
				terminate and remove your account and Community or limit your access to it. We may
				update those policies from time to time. We may also establish policies regarding
				your Community, such as how long your Community content will be retained on the
				Site. We have no responsibility or liability for the deletion or failure to store
				any content.
			</p>
			<h3>User-Generated Content</h3>
			<p>
				PubPub includes features that allow you or others to contribute User-Generated
				Content. The Site, Third Party Publishers, and Communities may solicit and publish
				User-Generated Content through blogs, video postings, and chat features, among other
				forums.
			</p>
			<p>
				By submitting User-Generated Content, you hereby make that User-Generated Content
				available under the Creative Commons Attribution 4.0 License, and you represent and
				warrant that you have the right to provide your User Generated Content under that
				license, that all of that User Generated Content is either authored by you, or
				provided by third parties under the Creative Commons Attribution 4.0 License or in
				the public domain, and that your User Generated Content contains no personally
				identifiable information of third parties who have not expressly authorized you to
				provide it as part of your User Generated Content. All of your User-Generated
				Content must be appropriately marked with licensing and attribution information.
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
				At all times, PubPub, in its sole discretion, may decide to assign to any
				Third-Party Publisher or Community, any or all of the rights to modify, edit,
				remove, prescreen, or withhold from publication the User-Generated Content on the
				Site.
			</p>
			<p>
				You acknowledge that the views and opinions expressed by other users on the Site are
				theirs alone and should not be ascribed to us. You understand that by using the
				Site, you may be exposed to User-Generated Content that might be offensive, harmful,
				inaccurate or otherwise inappropriate. Under no circumstances will we or any
				Third-Party Publisher or Community be liable in any way for any User-Generated
				Content, including, but not limited to, any errors or omissions in any
				User-Generated Content, or any loss or damage of any kind incurred as a result of
				the use of any User-Generated Content made available via the Site or disseminated
				elsewhere.
			</p>
			<h3>Registration and Termination of Access</h3>
			<p>
				Certain areas of the Site may require registration or may otherwise ask you to
				provide information in order to participate. The decision to provide this
				information is optional; however, if you elect not to provide such information, you
				may not be able to access certain features of the Site. When you register, you must
				provide information to PubPub that is accurate, current and complete (excepting the
				use of a pseudonym). You must keep that information up to date. You must immediately
				notify PubPub of any unauthorized use of your password or any other breach of
				security. We will not be liable for any loss or damage arising from your failure to
				protect your password or account login information.
			</p>
			<p>
				We reserve the right to terminate any registration and otherwise deny Site access to
				any person for any reason. We have the right to refer any suspected fraudulent,
				abusive or illegal activity that may be grounds for suspension or termination of
				your account and/or use of the Site, to appropriate law enforcement authorities. You
				agree that we may terminate your account at any time for any reason or no reason. If
				we do so other than for breach of these terms or the AUP, we will refund to you a
				pro-rated portion of fees you have already paid to us, if any, for the remaining
				term pertaining to those fees.
			</p>
			<h3>Disclaimer of Warranty / Limitation of Liability</h3>
			<p>
				Your use of the Site is at your sole risk. TO THE FULLEST EXTENT PERMITTED BY THE
				LAW, WE AND ALL THIRD-PARTY PUBLISHERS AND COMMUNITIES (COLLECTIVELY, “THE
				DISCLAIMING PARTIES”) DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION
				WITH THE SITE AND YOUR USE THEREOF, INCLUDING BUT NOT LIMITED TO WARRANTIES AS TO
				MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR NON-INFRINGEMENT.
			</p>
			<p>
				You agree that the Disclaiming Parties will not be liable to you for any indirect
				loss or damages, including without limitation consequential or incidental damages,
				arising out of or relating to these Terms, or your use or inability to use the Site
				whether based in contract, tort, or other law.
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
				The Indemnified Parties shall have the right, at their own expense, to assume the
				exclusive defense and control of any matter subject to indemnification by you.
			</p>
			<h3>Third-Party Beneficiaries</h3>
			<p>
				All Third-Party Publishers and Communities are third-party beneficiaries of these
				Terms of Service, to the extent their interests may appear, and the administrators
				of the Third-Party Publishers and Communities may, by working together with PubPub,
				enforce the provisions of these Terms of Service only as related to such Third-Party
				Content or Communities. PupPub will reasonably cooperate with such administrators in
				enforcing the provisions of these Terms of Service. Third-Party Publishers and
				Communities may assign or transfer these Terms of Service, as applicable to their
				relationship with you, without restriction, as part of any assignment of any
				Third-Party Content or Community, in whole or in part, to any other publisher or
				platform, and such Terms of Service will be binding on and inure to the benefit of
				their successors and assigns.
			</p>
			<h4>Third-Party Policies</h4>
			<p>
				Third-Party Publishers and Communities may include their own Third-Party Policies on
				the pages of their Communities, so long as: (i) the Third-Party Policies do not
				conflict with these Terms of Service, PubPub’s Acceptable Use Policy, PubPub’s
				Privacy Policy, and any other PubPub terms or policies; and (ii) the Third-Party
				Publishers and Communities are solely responsible for the enforcement of their
				Third-Party Policies. To the extent any conflict arises between a Third-Party Policy
				and any of PubPub’s terms or policies, the relevant PubPub term or policy will
				control for that conflict.
			</p>
			<h3>General</h3>
			<p>
				These Terms of Service (including the Acceptable Use Policy) constitute the entire
				agreement between you and us with respect to your use of the Site, superseding any
				prior agreements. KFI reserves the right to these Terms of Service and to modify
				PubPub’s features at any time by posting changes to these Terms of Service at 
				<a
					href={`https://${props.hostname}/legal/proposed-terms`}
				>{`${props.hostname}/legal/proposed-terms`}</a>
				, and sending all registered users email notification that changes have been made.
				KFI will use reasonable efforts to post such changes at least 30 days before their
				effective date, but non-material changes or changes that are necessary to avoid
				liability by KFI may take effect more quickly.
			</p>
			<p>
				The section titles in these Terms of Service are for convenience only and have no
				legal or contractual effect.
			</p>
			<p>The provisions of these terms will survive any termination of services to you.</p>
			<p>
				These Terms of Service will be governed by the laws of the Commonwealth of
				Massachusetts without regard to its conflicts of laws provisions. In the case of any
				dispute arising out of or relating to these Terms of Service or your use of the
				Site, the state and federal courts located within the Commonwealth of Massachusetts
				will have exclusive jurisdiction, and both we and you agree to submit to the
				personal jurisdiction of such courts.
			</p>
			<p>
				Any failure to enforce any term or condition of these Terms of Service will not
				constitute a waiver of rights. If any provision of these Terms of Service is found
				by a court of competent jurisdiction to be invalid, it will be interpreted to have
				the broadest validity consistent with law, and the other provisions of these Terms
				of Service shall remain in effect.
			</p>
			<p>
				These Terms of Service are personal to you and non-assignable, except with our prior
				written permission. If you wish to transfer control of your Community, please
				contact us at ________________. PubPub may assign or transfer these Terms of Service
				and your agreement thereto upon notice to you. These Terms of Service will be
				binding on, and inure to the benefit of permitted successors and assigns.
			</p>
			<p>
				Any notice that we provide to you may be provided to the email address on file for
				your account. You must inform us of any change in that email address.
			</p>
			<h3>Questions and Comments</h3>
			<p>
				If you have any questions about these Terms of Service, please contact 
				<a href="mailto:help@pubpub.org?subject=Terms%252520Question" title="">
					help@pubpub.org
				</a>
				.
			</p>
			<h3>Definitions</h3>
			<p>
				“<strong>Acceptable Use Policy</strong>” means the policy published by us for the
				Site.
			</p>
			<p>
				“<strong>Community</strong>” means a publicly available content repository on PubPub
				where common disciplinary interests aggregate around content contributed by creators
				and readers.
			</p>
			<p>
				“<strong>Site</strong>” means the PubPub web site.
			</p>
			<p>
				“<strong>Site Content</strong>” means all content, features, and functionality
				posted to or provided via the Site, such as journals, books, and other publications
				created by persons other than you (“Third-Party Content”), all User-Generated
				Content.
			</p>
			<p>
				”<strong>Third-Party Publishers</strong>” are persons other than you for which we
				provide hosting services to for the publication of journals, books, or other curated
				content.
			</p>
			<p>
				“<strong>Third-Party Policies</strong>” are the Third-Party Publishers’ and
				Communities’ own policies, such as terms of service or acceptable use policies.
			</p>
			<p>
				“<strong>User-Generated Content</strong>” means any content, whether or not
				copyrightable, that users submit to the Site.
			</p>
		</div>
	);
};

ProposedTerms.propTypes = propTypes;
export default ProposedTerms;

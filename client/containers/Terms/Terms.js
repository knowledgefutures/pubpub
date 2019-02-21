import React from 'react';
import PropTypes from 'prop-types';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper } from 'utilities';

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const Terms = function(props) {
	return (
		<div id="terms-container">
			<PageWrapper
				loginData={props.loginData}
				communityData={props.communityData}
				locationData={props.locationData}
				hideNav={props.locationData.isBasePubPub}
			>
				<div className="legal-wrapper">
					<div className="container narrow">
						<div className="row">
							<div className="col-12">
								<h1>Terms of Service</h1>
								<p>
									PubPub is a project of students and researchers in the Media
									Laboratory at Massachusetts Institute of Technology (“MIT”).
									PubPub is a tool and service to write, publish, and read
									published work. PubPub is built to modernize many of the old
									traditions of academic publishing which have led to
									inefficiency, corruption, and the detriment of our pursuit of
									science.
								</p>
								<p>
									PubPub reserves the right to change the terms of the Terms of
									Service (&quot;TOS&quot;) or to modify its features at any time.
									The Site will post changes to the terms of this User Agreement
									at {props.locationData.hostname}/tos, and by accessing the Site
									after modifications to this User Agreement have been posted, you
									agree to be bound by all the modified terms.
								</p>
								<h1>Acceptance of Terms</h1>
								<p>
									By accessing content on the PubPub website (the “Site,” which
									includes all pages within the pubpub.org host directory and
									subdomains, all pages hosted on PubPub servers regardless of
									domain (including but not limited to Journal pages), and all
									associated services),
								</p>
								<ol>
									<li>
										You accept and agree to be bound by all of the terms of this
										TOS; and
									</li>
									<li>
										You affirm that you are either 17 years of age or older or,
										if you are younger than 17, that your parent or legal
										guardian accepts these Terms of Service on your behalf.
									</li>
								</ol>
								<p>
									You must be (a) 17 years or over or (b) a parent or guardian
									must accept on your behalf these Terms of Service to access
									registration-only features on this Site. If we discover or have
									any reason to suspect that you have not met either of these
									conditions, then we reserve the right to suspend or terminate
									your registration to this Site immediately and without notice.
								</p>
								<h1>Use of the Site</h1>
								<p>
									For the purposes of this TOS, the term “Site Content” shall
									include all content, features, and functionality posted to the
									Site by PubPub as well as User-Generated Content.
								</p>
								<p>
									Except where otherwise noted, Site Content is licensed under the
									Creative Commons Attribution (CC-BY) 4.0 License and may be used
									under the terms of that license or any later version of a
									Creative Commons Attribution License
								</p>
								<h1>Use of Third-Party Content</h1>
								<p>
									To the extent the Site incorporates the copyrighted material of
									third-parties (“Third-Party Content”), you represent, warrant,
									and agree that no Third-Party Content posted or otherwise shared
									by you on or through any of the Site, violates or infringes upon
									the rights of any third-party, including copyright, trademark,
									privacy, publicity, or other personal or proprietary rights,
									breaches or conflicts with any obligation, such as a
									confidentiality obligation, or contains libelous, defamatory, or
									otherwise unlawful material.
								</p>
								<p>
									MIT and PubPub do not warrant that any use of Third-Party
									Content will not infringe the rights of the content owners.
								</p>
								<p>
									If you believe that any content on the Site infringes your
									copyrights, please{' '}
									<a href="http://web.mit.edu/copyright/dmca-notices.html">
										click here
									</a>{' '}
									for more information, including the email address for MIT’s DMCA
									agent, to whom copyright infringement notifications should be
									sent.
								</p>
								<h1>User-Generated Content</h1>
								<p>
									The Site includes features that support and publish
									User-Generated Content. The term “User-Generated Content,” for
									purposes of this TOS, means any copyrightable content that users
									submit to the Site. The Site may solicit and publish
									User-Generated Content through its blog, video postings, and
									chat features, among other forums. You shall not make use of
									these features:
								</p>
								<ul>
									<li>
										To make comments that are threatening, knowingly false, or
										unlawful; or to engage in personal attacks;
									</li>
									<li>
										To impersonate any person or entity or create a false
										identity on the Site;
									</li>
									<li>
										To harass, threaten, stalk, embarrass or cause distress,
										unwanted attention or discomfort to any user of the Site;
									</li>
									<li>
										To disseminate or transmit “spam,” unsolicited messages,
										chain letters, advertisements, solicitations, or other
										unsolicited commercial communications, including (but not
										limited to) communications describing investment
										opportunities;
									</li>
									<li>
										To post material that infringes a copyright, trademark or
										patent right, trade secret or other legal right of any
										person, corporation or institution;
									</li>
									<li>
										To knowingly disseminate or transmit viruses, Trojan horses,
										worms, defects, date bombs, time bombs, malware, spyware, or
										other items of a destructive nature or any other malicious
										code or program;
									</li>
									<li>
										To knowingly carry out any action with the intent or effect
										of disrupting other users’ experience of the Site, such as
										intentionally causing a chat screen to scroll faster than
										other users are able to read, or deploying macros with large
										amounts of text for the purpose of disrupting the normal
										flow of user chats.
									</li>
								</ul>
								<p>
									By submitting User-Generated Content, you represent, warrant,
									and agree that no User-Generated Content posted or otherwise
									shared by you on or through any of the Site, violates or
									infringes upon the rights of any third-party, including
									copyright, trademark, privacy, publicity, or other personal or
									proprietary rights, breaches or conflicts with any obligation,
									such as a confidentiality obligation, or contains libelous,
									defamatory, or otherwise unlawful material.
								</p>
								<p>
									You hereby agree that User-Generated Content: (a) is hereby
									licensed under the Creative Commons Attribution (CC-BY) 4.0
									License and may be used under the terms of that license or any
									later version of a Creative Commons Attribution License, or (b)
									is in the public domain (such as Content that is not
									copyrightable or Content you make available under CC0), or (c)
									if not owned by you, (i) is available under a Creative Commons
									Attribution 4.0 License or (ii) is a media file that is
									available under any Creative Commons license or that you are
									authorized by law to post or share through any of the Services,
									such as under the fair use doctrine, and that is prominently
									marked as being subject to third-party copyright. All of Your
									Content must be appropriately marked with licensing and
									attribution information.
								</p>
								<p>
									Upon publishing, an archive of the content will perpetually be
									available to the public for reference.
								</p>
								<p>
									You acknowledge and accept that User-Generated Content posted to
									the Site may be made available for the public to access, view,
									and use, subject to the limited license set forth above (“Use of
									Site”).
								</p>
								<p>
									PubPub monitors User-Generated Content on the Site, and PubPub
									reserves the right to modify, edit, or remove any of said
									content at its discretion, without notice, and for any reason.
									PubPub may prescreen User-Generated Content and may decide, in
									its discretion, without notice, and for any reason, not to
									publish it. PubPub will not modify or edit any scholarly work
									that you submit for posting on the Site, but PubPub may decide,
									in its discretion, to withhold it from publication in its
									entirety. PubPub assumes no liability for monitoring, modifying,
									removing, or declining to publish User-Generated Content on this
									Service.
								</p>
								<p>
									You acknowledge and accept that the views and opinions expressed
									by other users on the Site are theirs alone and should not be
									ascribed to PubPub or to MIT. User-Generated Content and
									Third-Party Content are the sole responsibility of the users and
									third-parties, and their accuracy and completeness are not
									endorsed or guaranteed by PubPub or MIT.
								</p>
								<h1>Journals</h1>
								<p>
									PubPub allows registered users to create &quot;Journals&quot;
									that aggregate their own and other users&apos; Pubs under a
									single page. A Journal may reside on the PubPub domain or on a
									domain of the Journal administrator&apos;s choice. In either
									case, the content displayed in the Journal, including any Pubs,
									is displayed exclusively from a PubPub server. A Journal
									administrator does not need the approval of a Pub&apos;s author
									in order to include the Pub on his or her page. You may submit
									your Pub for inclusion in a Journal, but it is up to the
									Journal&apos;s administrator to decide whether to include it.
									PubPub displays in your profile a list of your Pubs and the
									Journals in which they appear. We may also send you a
									notification each time a Journal has elected to include your
									Pub, if you have opted in to receiving email from PubPub.
								</p>
								<h1>Prohibited Uses of the Site</h1>
								<p>
									You may not access or use the Site in any manner that could
									damage or overburden any MIT server, or any network connected to
									any MIT server. You may not use the Site in any manner that
									would interfere with any other party’s use of the Site.
								</p>
								<h1>Use of Names</h1>
								<p>
									You may not use MIT’s names, trademarks, logos, or insignia, or
									any version, abbreviation or representation of them, in any
									advertising, publicity, promotional materials or other public
									announcement without the prior written consent of MIT’s
									Technology Licensing Office, which consent MIT may withhold in
									its sole discretion.
								</p>
								<h1>Registration, Privacy, and Termination of Access</h1>
								<p>
									Certain areas of the Site may require registration or may
									otherwise ask you to provide information in order to
									participate. The decision to provide this information is
									optional; however if you elect not to provide such information,
									you may not be able to access certain content, features, or
									functionalities. When you register, you must provide information
									to PubPub that is accurate, current and complete (excepting the
									use of a pseudonym). The Site’s{' '}
									<a href="/privacy">Privacy Policy</a> governs the use of the
									information you report. PubPub reserves the right to terminate
									the registrations and otherwise deny Site access to any person
									for any reason. The Site will not be liable for any loss or
									damage arising from your failure to protect your password or
									account login information.
								</p>
								<h1>Disclaimer of Warranty / Limitation of Liability</h1>
								<p>
									Your use of the Site is at your sole risk. To the fullest extent
									permitted by the law, MIT disclaims all warranties, express or
									implied, in connection with the Site and your use thereof. MIT
									makes no warranties or representations about the accuracy or
									completeness of the Site’s content (including User-Generated
									Content and Third-Party Content) or the content of any websites
									linked to this Site and assumes no liability or responsibility
									for any (1) errors, mistakes, omissions, or inaccuracies in
									content; (2) personal injury or property damage, of any nature
									whatsoever, resulting from your access to and use of the Site;
									(3) unauthorized access to or use of MIT’s secure servers and/or
									any and all personal information and/or financial information
									stored therein; (4) interruption or cessation of transmission to
									or from the Site; (5) bugs, viruses, Trojan horses, or the like
									that may be transmitted to or through the Site by any
									third-party; and/ or (6) content or any loss or damage of any
									kind incurred as a result of the use of any content posted,
									emailed, transmitted, or otherwise made available via the Site.
									You assume all risk as to the quality, function, and performance
									of the Site, and to all transactions you undertake on the Site,
									including without limitation submission of any User-Generated
									Content.
								</p>
								<p>
									You agree that MIT will not be liable to you for any loss or
									damages, either actual or consequential, arising out of or
									relating to these terms, or your (or any third-party’s) use or
									inability to use the Site, or your placement of User-Generated
									Content on the Site, or your reliance upon information obtained
									from or through the Site, or your communications with other
									users of the Site. In particular, MIT will have no liability for
									any consequential, indirect, punitive, special or incidental
									damages, whether foreseeable or unforeseeable, (including, but
									not limited to, claims for defamation, errors, loss of data, or
									interruption in availability of data), arising out of or
									relating to these terms, your use or inability to use a site,
									your placement of content on the Site, your reliance upon
									information obtained from or through a Site, or your
									communications with other users of the Site, whether based in
									contract, tort, statutory or other law, except only in the case
									of death or personal injury where and only to the extent that
									applicable law requires such liability.
								</p>
								<h1>Idemnification</h1>
								<p>
									You hereby indemnify, defend, and hold harmless MIT and its
									affiliates, employees, faculty members, fellows, students,
									members of their governing boards and agents (collectively, the
									“Indemnified Parties”) from and against any and all liability
									and costs, including, without limitation, reasonable attorneys’
									fees, incurred by the Indemnified Parties in connection with any
									claim arising out of (1) your posting of User-Generated Content;
									(2) any breach by you or any user of your account of this TOS or
									the foregoing representations, warranties and covenants; or (3)
									your or any user of your account’s violation of applicable law.
									You shall cooperate as reasonably required in the defense of any
									such claim. MIT reserves the right, at its own expense, to
									assume the exclusive defense and control of any matter subject
									to indemnification by you.
								</p>
								<h1>Contacting this Website</h1>
								<p>
									If you have any questions about this TOS or Privacy Policy, the
									practices of the Site, or your dealings with this Site, you can
									contact the Editor at pubpub@media.mit.edu .
								</p>
								<h1>Effective Date of Agreement</h1>
								<p>This TOS is in effect as of the August 31, 2016.</p>
							</div>
						</div>
					</div>
				</div>
			</PageWrapper>
		</div>
	);
};

Terms.propTypes = propTypes;
export default Terms;

hydrateWrapper(Terms);

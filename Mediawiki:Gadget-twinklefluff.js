// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklefluff.js: Revert/rollback module
 ****************************************
 * Mode of invocation:     Links on contributions, recent changes, history, and diff pages
 * Active on:              Diff pages, history pages, Special:RecentChanges(Linked),
                           and Special:Contributions
 */

/**
 Twinklefluff revert and antivandalism utility
 */

Twinkle.fluff = function twinklefluff() {
	// Only proceed if the user can actually edit the page in question
	// (see #632 for contribs issue).  wgIsProbablyEditable should take
	// care of namespace/contentModel restrictions as well as explicit
	// protections; it won't take care of cascading or TitleBlacklist.
	if (mw.config.get('wgIsProbablyEditable')) {
		// wgDiffOldId included for clarity in if else loop [[phab:T214985]]
		if (mw.config.get('wgDiffNewId') || mw.config.get('wgDiffOldId')) {
			// Reload alongside the revision slider
			mw.hook('wikipage.diff').add(function () {
				Twinkle.fluff.addLinks.diff();
			});
		} else if (mw.config.get('wgAction') === 'view' && mw.config.get('wgRevisionId') && mw.config.get('wgCurRevisionId') !== mw.config.get('wgRevisionId')) {
			Twinkle.fluff.addLinks.oldid();
		} else if (mw.config.get('wgAction') === 'history' && mw.config.get('wgArticleId')) {
			Twinkle.fluff.addLinks.history();
		}
	} else if (mw.config.get('wgNamespaceNumber') === -1) {
		Twinkle.fluff.skipTalk = !Twinkle.getPref('openTalkPageOnAutoRevert');
		Twinkle.fluff.rollbackInPlace = Twinkle.getPref('rollbackInPlace');

		if (mw.config.get('wgCanonicalSpecialPageName') === 'Contributions') {
			Twinkle.fluff.addLinks.contributions();
		} else if (mw.config.get('wgCanonicalSpecialPageName') === 'Recentchanges' || mw.config.get('wgCanonicalSpecialPageName') === 'Recentchangeslinked') {
			// Reload with recent changes updates
			// structuredChangeFilters.ui.initialized is just on load
			mw.hook('wikipage.content').add(function(item) {
				if (item.is('div')) {
					Twinkle.fluff.addLinks.recentchanges();
				}
			});
		}
	}
};

// A list of usernames, usually only bots, that vandalism revert is jumped
// over; that is, if vandalism revert was chosen on such username, then its
// target is on the revision before.  This is for handling quick bots that
// makes edits seconds after the original edit is made.  This only affects
// vandalism rollback; for good faith rollback, it will stop, indicating a bot
// has no faith, and for normal rollback, it will rollback that edit.
Twinkle.fluff.trustedBots = ['AnomieBOT', 'SineBot', 'MajavahBot'];
Twinkle.fluff.skipTalk = null;
Twinkle.fluff.rollbackInPlace = null;
// String to insert when a username is hidden
Twinkle.fluff.hiddenName = 'অজানা ব্যবহারকারী';

// Consolidated construction of fluff links
Twinkle.fluff.linkBuilder = {
	spanTag: function(color, content) {
		var span = document.createElement('span');
		span.style.color = color;
		span.appendChild(document.createTextNode(content));
		return span;
	},

	buildLink: function(color, text) {
		var link = document.createElement('a');
		link.appendChild(Twinkle.fluff.linkBuilder.spanTag('Black', '['));
		link.appendChild(Twinkle.fluff.linkBuilder.spanTag(color, text));
		link.appendChild(Twinkle.fluff.linkBuilder.spanTag('Black', ']'));
		link.href = '#';
		return link;
	},

	/**
	 * @param {string} [vandal=null] - Username of the editor being reverted
	 * Provide a falsey value if the username is hidden, defaults to null
	 * @param {boolean} inline - True to create two links in a span, false
	 * to create three links in a div (optional)
	 * @param {number|string} [rev=wgCurRevisionId] - Revision ID being reverted (optional)
	 * @param {string} [page=wgPageName] - Page being reverted (optional)
	 */
	rollbackLinks: function(vandal, inline, rev, page) {
		vandal = vandal || null;

		var elem = inline ? 'span' : 'div';
		var revNode = document.createElement(elem);

		rev = parseInt(rev, 10);
		if (rev) {
			revNode.setAttribute('id', 'tw-revert' + rev);
		} else {
			revNode.setAttribute('id', 'tw-revert');
		}

		var separator = inline ? ' ' : ' || ';
		var sepNode1 = document.createElement('span');
		var sepText = document.createTextNode(separator);
		sepNode1.setAttribute('class', 'tw-rollback-link-separator');
		sepNode1.appendChild(sepText);

		var sepNode2 = sepNode1.cloneNode(true);

		var normNode = document.createElement('span');
		var vandNode = document.createElement('span');

		var normLink = Twinkle.fluff.linkBuilder.buildLink('SteelBlue', 'সাধারণ রোলব্যাক');
		var vandLink = Twinkle.fluff.linkBuilder.buildLink('Red', 'ধ্বংসপ্রবণতা রোলব্যাক');

		normLink.style.fontWeight = 'bold';
		vandLink.style.fontWeight = 'bold';

		$(normLink).click(function() {
			Twinkle.fluff.revert('norm', vandal, rev, page);
			Twinkle.fluff.disableLinks(revNode);
		});
		$(vandLink).click(function() {
			Twinkle.fluff.revert('vand', vandal, rev, page);
			Twinkle.fluff.disableLinks(revNode);
		});

		normNode.setAttribute('class', 'tw-rollback-link-normal');
		vandNode.setAttribute('class', 'tw-rollback-link-vandalism');

		normNode.appendChild(sepNode1);
		vandNode.appendChild(sepNode2);

		normNode.appendChild(normLink);
		vandNode.appendChild(vandLink);

		if (!inline) {
			var agfNode = document.createElement('span');
			var agfLink = Twinkle.fluff.linkBuilder.buildLink('DarkOliveGreen', 'আস্থা রেখে রোলব্যাক');
			$(agfLink).click(function() {
				Twinkle.fluff.revert('agf', vandal, rev, page);
				// Twinkle.fluff.disableLinks(revNode); // rollbackInPlace not relevant for any inline situations
			});
			agfNode.setAttribute('class', 'tw-rollback-link-agf');
			agfLink.style.fontWeight = 'bold';
			agfNode.appendChild(agfLink);
			revNode.appendChild(agfNode);
		}

		revNode.appendChild(normNode);
		revNode.appendChild(vandNode);

		return revNode;
	},

	// Build [restore this revision] links
	restoreThisRevisionLink: function(revisionRef, inline) {
		// If not a specific revision number, should be wgDiffNewId/wgDiffOldId/wgRevisionId
		revisionRef = typeof revisionRef === 'number' ? revisionRef : mw.config.get(revisionRef);

		var elem = inline ? 'span' : 'div';
		var revertToRevisionNode = document.createElement(elem);

		revertToRevisionNode.setAttribute('id', 'tw-revert-to-' + revisionRef);
		revertToRevisionNode.style.fontWeight = 'bold';

		var revertToRevisionLink = Twinkle.fluff.linkBuilder.buildLink('SaddleBrown', 'এই সংস্করণ ফিরিয়ে আনুন');
		$(revertToRevisionLink).click(function() {
			Twinkle.fluff.revertToRevision(revisionRef);
		});

		if (inline) {
			revertToRevisionNode.appendChild(document.createTextNode(' '));
		}
		revertToRevisionNode.appendChild(revertToRevisionLink);
		return revertToRevisionNode;
	}
};


Twinkle.fluff.addLinks = {
	contributions: function() {
		// $('sp-contributions-footer-anon-range') relies on the fmbox
		// id in [[MediaWiki:Sp-contributions-footer-anon-range]] and
		// is used to show rollback/vandalism links for IP ranges
		var isRange = !!$('#sp-contributions-footer-anon-range')[0];
		if (mw.config.exists('wgRelevantUserName') || isRange) {
			// Get the username these contributions are for
			var username = mw.config.get('wgRelevantUserName');
			if (Twinkle.getPref('showRollbackLinks').indexOf('contribs') !== -1 ||
				(mw.config.get('wgUserName') !== username && Twinkle.getPref('showRollbackLinks').indexOf('others') !== -1) ||
				(mw.config.get('wgUserName') === username && Twinkle.getPref('showRollbackLinks').indexOf('mine') !== -1)) {
				var $list = $('#mw-content-text').find('ul li:has(span.mw-uctop):has(.mw-changeslist-diff)');

				$list.each(function(key, current) {
					// revid is also available in the href of both
					// .mw-changeslist-date or .mw-changeslist-diff
					var page = $(current).find('.mw-contributions-title').text();

					// Get username for IP ranges (wgRelevantUserName is null)
					if (isRange) {
						// The :not is possibly unnecessary, as it appears that
						// .mw-userlink is simply not present if the username is hidden
						username = $(current).find('.mw-userlink:not(.history-deleted)').text();
					}

					// It's unlikely, but we can't easily check for revdel'd usernames
					// since only a strong element is provided, with no easy selector [[phab:T255903]]
					current.appendChild(Twinkle.fluff.linkBuilder.rollbackLinks(username, true, current.dataset.mwRevid, page));
				});
			}
		}
	},

	recentchanges: function() {
		if (Twinkle.getPref('showRollbackLinks').indexOf('recent') !== -1) {
			// Latest and revertable (not page creations, logs, categorizations, etc.)
			var $list = $('.mw-changeslist .mw-changeslist-last.mw-changeslist-src-mw-edit');
			// Exclude top-level header if "group changes" preference is used
			// and find only individual lines or nested lines
			$list = $list.not('.mw-rcfilters-ui-highlights-enhanced-toplevel').find('.mw-changeslist-line-inner, td.mw-enhanced-rc-nested');

			$list.each(function(key, current) {
				// The :not is possibly unnecessary, as it appears that
				// .mw-userlink is simply not present if the username is hidden
				var vandal = $(current).find('.mw-userlink:not(.history-deleted)').text();
				var href = $(current).find('.mw-changeslist-diff').attr('href');
				var rev = mw.util.getParamValue('diff', href);
				var page = current.dataset.targetPage;
				current.appendChild(Twinkle.fluff.linkBuilder.rollbackLinks(vandal, true, rev, page));
			});
		}
	},

	history: function() {
		if (Twinkle.getPref('showRollbackLinks').indexOf('history') !== -1) {
			// All revs
			var histList = $('#pagehistory li').toArray();

			// On first page of results, so add revert/rollback
			// links to the top revision
			if (!$('a.mw-firstlink').length) {
				var first = histList.shift();
				var vandal = $(first).find('.mw-userlink:not(.history-deleted)').text();

				// Check for first username different than the top user,
				// only apply rollback links if/when found
				// for faster than every
				for (var i = 0; i < histList.length; i++) {
					if ($(histList[i]).find('.mw-userlink').text() !== vandal) {
						first.appendChild(Twinkle.fluff.linkBuilder.rollbackLinks(vandal, true));
						break;
					}
				}
			}

			// oldid
			histList.forEach(function(rev) {
				// From restoreThisRevision, non-transferable
				// If the text has been revdel'd, it gets wrapped in a span with .history-deleted,
				// and href will be undefined (and thus oldid is NaN)
				var href = rev.querySelector('.mw-changeslist-date').href;
				var oldid = parseInt(mw.util.getParamValue('oldid', href), 10);
				if (!isNaN(oldid)) {
					rev.appendChild(Twinkle.fluff.linkBuilder.restoreThisRevisionLink(oldid, true));
				}
			});


		}
	},

	diff: function() {
		// Autofill user talk links on diffs with vanarticle for easy warning, but don't autowarn
		var warnFromTalk = function(xtitle) {
			var talkLink = $('#mw-diff-' + xtitle + '2 .mw-usertoollinks a').first();
			if (talkLink.length) {
				var extraParams = 'vanarticle=' + mw.util.rawurlencode(Morebits.pageNameNorm) + '&' + 'noautowarn=true';
				// diffIDs for vanarticlerevid
				extraParams += '&vanarticlerevid=';
				extraParams += xtitle === 'otitle' ? mw.config.get('wgDiffOldId') : mw.config.get('wgDiffNewId');

				var href = talkLink.attr('href');
				if (href.indexOf('?') === -1) {
					talkLink.attr('href', href + '?' + extraParams);
				} else {
					talkLink.attr('href', href + '&' + extraParams);
				}
			}
		};

		// Older revision
		warnFromTalk('otitle'); // Add quick-warn link to user talk link
		// Don't load if there's a single revision or weird diff (cur on latest)
		if (mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId'))) {
			// Add a [restore this revision] link to the older revision
			var oldTitle = document.getElementById('mw-diff-otitle1').parentNode;
			oldTitle.insertBefore(Twinkle.fluff.linkBuilder.restoreThisRevisionLink('wgDiffOldId'), oldTitle.firstChild);
		}

		// Newer revision
		warnFromTalk('ntitle'); // Add quick-warn link to user talk link
		// Add either restore or rollback links to the newer revision
		// Don't show if there's a single revision or weird diff (prev on first)
		if (document.getElementById('differences-nextlink')) {
			// Not latest revision, add [restore this revision] link to newer revision
			var newTitle = document.getElementById('mw-diff-ntitle1').parentNode;
			newTitle.insertBefore(Twinkle.fluff.linkBuilder.restoreThisRevisionLink('wgDiffNewId'), newTitle.firstChild);
		} else if (Twinkle.getPref('showRollbackLinks').indexOf('diff') !== -1 && mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId') || document.getElementById('differences-prevlink'))) {
			// Normally .mw-userlink is a link, but if the
			// username is hidden, it will be a span with
			// .history-deleted as well. When a sysop views the
			// hidden content, the span contains the username in a
			// link element, which will *just* have
			// .mw-userlink. The below thus finds the first
			// instance of the class, which if hidden is the span
			// and thus text returns undefined. Technically, this
			// is a place where sysops *could* have more
			// information available to them (as above, via
			// &unhide=1), since the username will be available by
			// checking a.mw-userlink instead, but revert() will
			// need reworking around userHidden
			var vandal = $('#mw-diff-ntitle2').find('.mw-userlink')[0];
			// See #1337
			vandal = vandal ? vandal.text : '';
			var ntitle = document.getElementById('mw-diff-ntitle1').parentNode;

			ntitle.insertBefore(Twinkle.fluff.linkBuilder.rollbackLinks(vandal), ntitle.firstChild);
		}
	},

	oldid: function() { // Add a [restore this revision] link on old revisions
		var revisionInfo = document.getElementById('mw-revision-info');
		if (revisionInfo) {
			var title = revisionInfo.parentNode;
			title.insertBefore(Twinkle.fluff.linkBuilder.restoreThisRevisionLink('wgRevisionId'), title.firstChild);
		}
	}
};

Twinkle.fluff.disableLinks = function disablelinks(parentNode) {
	// Array.from not available in IE11 :(
	$(parentNode).children().each(function(_ix, node) {
		node.innerHTML = node.textContent; // Feels like cheating
		$(node).css('font-weight', 'normal').css('color', 'darkgray');
	});
};


Twinkle.fluff.revert = function revertPage(type, vandal, rev, page) {
	if (mw.util.isIPv6Address(vandal)) {
		vandal = Morebits.ip.sanitizeIPv6(vandal);
	}

	var pagename = page || mw.config.get('wgPageName');
	var revid = rev || mw.config.get('wgCurRevisionId');

	if (Twinkle.fluff.rollbackInPlace) {
		var notifyStatus = document.createElement('span');
		mw.notify(notifyStatus, {
			autoHide: false,
			title: page + ' পাতায় রোলব্যাক',
			tag: 'twinklefluff_' + rev // Shouldn't be necessary given disableLink
		});
		Morebits.status.init(notifyStatus);
	} else {
		Morebits.status.init(document.getElementById('mw-content-text'));
		$('#catlinks').remove();
	}

	var params = {
		type: type,
		user: vandal,
		userHidden: !vandal, // Keep track of whether the username was hidden
		pagename: pagename,
		revid: revid
	};

	var query = {
		action: 'query',
		prop: ['info', 'revisions', 'flagged'],
		titles: pagename,
		inprop: 'watched',
		intestactions: 'edit',
		rvlimit: Twinkle.getPref('revertMaxRevisions'),
		rvprop: [ 'ids', 'timestamp', 'user' ],
		curtimestamp: '',
		meta: 'tokens',
		type: 'csrf',
		format: 'json'
	};
	var wikipedia_api = new Morebits.wiki.api('পূর্ববর্তী সংস্করণের উপাত্ত নেয়া হচ্ছে', query, Twinkle.fluff.callbacks.main);
	wikipedia_api.params = params;
	wikipedia_api.post();
};

Twinkle.fluff.revertToRevision = function revertToRevision(oldrev) {

	Morebits.status.init(document.getElementById('mw-content-text'));

	var query = {
		action: 'query',
		prop: ['info', 'revisions'],
		titles: mw.config.get('wgPageName'),
		inprop: 'watched',
		rvlimit: 1,
		rvstartid: oldrev,
		rvprop: [ 'ids', 'user' ],
		curtimestamp: '',
		meta: 'tokens',
		type: 'csrf',
		format: 'json'
	};
	var wikipedia_api = new Morebits.wiki.api('পূর্ববর্তী সংস্করণের উপাত্ত নেওয়া হচ্ছে', query, Twinkle.fluff.callbacks.toRevision);
	wikipedia_api.params = { rev: oldrev };
	wikipedia_api.post();
};

Twinkle.fluff.callbacks = {
	toRevision: function(apiobj) {
		var response = apiobj.getResponse();

		var loadtimestamp = response.curtimestamp;
		var csrftoken = response.query.tokens.csrftoken;

		var page = response.query.pages[0];
		var lastrevid = parseInt(page.lastrevid, 10);
		var touched = page.touched;

		var rev = page.revisions[0];
		var revertToRevID = parseInt(rev.revid, 10);
		var revertToUser = rev.user;
		var revertToUserHidden = !!rev.userhidden;

		if (revertToRevID !== apiobj.params.rev) {
			apiobj.statelem.error('সংগৃহীত সংস্করণ অনুরোধকৃত সংস্করণের সাথে মেলেনি। পূর্বাবস্থায় ফেরত থামানো হচ্ছে');
			return;
		}

		var optional_summary = prompt('দয়া করে পূর্বাবস্থায় ফেরত নেয়ার কারণ উল্লেখ করুন:                                ', '');  // padded out to widen prompt in Firefox
		if (optional_summary === null) {
			apiobj.statelem.error('ব্যবহারকারী পূর্বাবস্থায় ফেরত বাতিল করেছেন');
			return;
		}

		var summary = Twinkle.fluff.formatSummary('$USER-এর করা ' + revertToRevID + ' নং সংস্করণে ফেরত',
			revertToUserHidden ? null : revertToUser, optional_summary);

		var query = {
			action: 'edit',
			title: mw.config.get('wgPageName'),
			summary: summary,
			tags: Twinkle.changeTags,
			token: csrftoken,
			undo: lastrevid,
			undoafter: revertToRevID,
			basetimestamp: touched,
			starttimestamp: loadtimestamp,
			minor: Twinkle.getPref('markRevertedPagesAsMinor').indexOf('torev') !== -1 ? true : undefined,
			format: 'json'
		};
		// Handle watching, possible expiry
		if (Twinkle.getPref('watchRevertedPages').indexOf('torev') !== -1) {
			var watchOrExpiry = Twinkle.getPref('watchRevertedExpiry');

			if (!watchOrExpiry || watchOrExpiry === 'no') {
				query.watchlist = 'nochange';
			} else if (watchOrExpiry === 'default' || watchOrExpiry === 'preferences') {
				query.watchlist = 'preferences';
			} else {
				query.watchlist = 'watch';
				// number allowed but not used in Twinkle.config.watchlistEnums
				if ((!page.watched || page.watchlistexpiry) && typeof watchOrExpiry === 'string' && watchOrExpiry !== 'yes') {
					query.watchlistexpiry = watchOrExpiry;
				}
			}
		}

		Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		Morebits.wiki.actionCompleted.notice = 'পূর্বাবস্থায় ফেরত সম্পন্ন';

		var wikipedia_api = new Morebits.wiki.api('ফেরত নেয়া বিষয়বস্তু সংরক্ষণ করা হচ্ছে', query, Twinkle.fluff.callbacks.complete, apiobj.statelem);
		wikipedia_api.params = apiobj.params;
		wikipedia_api.post();
	},
	main: function(apiobj) {
		var response = apiobj.getResponse();

		var loadtimestamp = response.curtimestamp;
		var csrftoken = response.query.tokens.csrftoken;

		var page = response.query.pages[0];
		if (!page.actions.edit) {
			apiobj.statelem.error("পাতাটি সম্পাদনায় অক্ষম, সম্ভবত এটি সুরক্ষিত");
			return;
		}

		var lastrevid = parseInt(page.lastrevid, 10);
		var touched = page.touched;

		var revs = page.revisions;

		var statelem = apiobj.statelem;
		var params = apiobj.params;

		if (revs.length < 1) {
			statelem.error('আমাদের কাছে একটির কম অতিরিক্ত সংস্করণ রয়েছে। তাই পূর্বাবস্থায় যাওয়া অসম্ভব।');
			return;
		}
		var top = revs[0];
		var lastuser = top.user;

		if (lastrevid < params.revid) {
			Morebits.status.error('Error', [ 'সার্ভার থেকে পাওয়া সর্বশেষ সংস্করণ আইডি, ', Morebits.htmlNode('strong', lastrevid), ', প্রদর্শিত সংস্করণ আইডির থেকে ছোট। এটা নির্দেশ করতে পারে যে, বর্তমান সংস্করণ অপসারিত, সার্ভার আটকে আছে, বা ভুল উপাত্ত চলে এসেছে। পূর্বাবস্থায় ফেরত থামানো হচ্ছে।' ]);
			return;
		}

		// Used for user-facing alerts, messages, etc., not edits or summaries
		var userNorm = params.user || Twinkle.fluff.hiddenName;
		var index = 1;
		if (params.revid !== lastrevid) {
			Morebits.status.warn('Warning', [ 'সর্বশেষ সংস্করণ ', Morebits.htmlNode('strong', lastrevid), ' আমাদের সংস্করণের সমান নয় ', Morebits.htmlNode('strong', params.revid) ]);
			// Treat ipv6 users on same 64 block as the same
			if (lastuser === params.user || (mw.util.isIPv6Address(params.user) && Morebits.ip.get64(lastuser) === Morebits.ip.get64(params.user))) {
				switch (params.type) {
					case 'vand':
						var diffUser = lastuser !== params.user;
						Morebits.status.info('Info', [ 'সর্বশেষ সংস্করণের সম্পাদক', Morebits.htmlNode('strong', userNorm),
							diffUser ? ', একই /৬৪ সাবনেটের' : '', '। যেহেতু ধ্বংসপ্রবণতা রোধ করছি, আমরা পূর্বাবস্থায় ফেরত নেয়া সম্পন্ন করব।' ]);
						break;
					case 'agf':
						Morebits.status.warn('Warning', [ 'সর্বশেষ সংস্করণের সম্পাদক হলেন ', Morebits.htmlNode('strong', userNorm), '। যেহেতু আমরা আস্থা রাখছি, আমরা পূর্বাবস্থায় ফেরত নেয়া থামাবো, কারণ সমস্যাটির সমাধান হয়ে থাকতে পারে।' ]);
						return;
					default:
						Morebits.status.warn('Notice', [ 'সর্বশেষ সংস্করণের সম্পাদক হলেন ', Morebits.htmlNode('strong', userNorm), ', তবে আমরা পূর্বাবস্থায় ফেরত নেয়া থামাবো।' ]);
						return;
				}
			} else if (params.type === 'vand' &&
					// Okay to test on user since it will either fail or sysop will correctly access it
					// Besides, none of the trusted bots are going to be revdel'd
					Twinkle.fluff.trustedBots.indexOf(top.user) !== -1 && revs.length > 1 &&
					revs[1].revid === params.revid) {
				Morebits.status.info('Info', [ 'সর্বশেষ সংস্করণের সম্পাদক ', Morebits.htmlNode('strong', lastuser), ', একটি বিশ্বস্ত বট এবং পূর্বের সংস্করণের সম্পাদক আমাদের ধ্বংসাত্মক ব্যবহারকারীর, তাই আমরা পূর্বাবস্থায় ফেরত নিবো।' ]);
				index = 2;
			} else {
				Morebits.status.error('Error', [ 'সর্বশেষ সংস্করণের সম্পাদক হলেন ', Morebits.htmlNode('strong', lastuser), ', তাই এটি ইতিমধ্যে বাতিল হয়ে থাকতে পারে, আমরা পূর্বাবস্থায় ফেরত নেয়া থামাবো']);
				return;
			}

		} else {
			// Expected revision is the same, so the users must match;
			// this allows sysops to know whether the users are the same
			params.user = lastuser;
			userNorm = params.user || Twinkle.fluff.hiddenName;
		}

		if (Twinkle.fluff.trustedBots.indexOf(params.user) !== -1) {
			switch (params.type) {
				case 'vand':
					Morebits.status.info('Info', [ 'ধ্বংপ্রবণতারোধী রোলব্যাক ব্যবহার করা হয়েছে ', Morebits.htmlNode('strong', userNorm), ' এর উপর। যেহেতু এটি বিশ্বস্ত বট, আমাদের ধারণা আপনি বরং পূর্বের সম্পাদকের ধ্বংসপ্রবণতা বাতিল করতে চেয়েছেন।' ]);
					index = 2;
					params.user = revs[1].user;
					params.userHidden = !!revs[1].userhidden;
					break;
				case 'agf':
					Morebits.status.warn('Notice', [ 'Good faith revert was chosen on ', Morebits.htmlNode('strong', userNorm), '. This is a trusted bot and thus AGF rollback will not proceed.' ]);
					return;
				case 'norm':
				/* falls through */
				default:
					var cont = confirm('Normal revert was chosen, but the most recent edit was made by a trusted bot (' + userNorm + '). Do you want to revert the revision before instead?');
					if (cont) {
						Morebits.status.info('Info', [ 'Normal revert was chosen on ', Morebits.htmlNode('strong', userNorm), '. This is a trusted bot, and per confirmation, we\'ll revert the previous revision instead.' ]);
						index = 2;
						params.user = revs[1].user;
						params.userHidden = !!revs[1].userhidden;
						userNorm = params.user || Twinkle.fluff.hiddenName;
					} else {
						Morebits.status.warn('Notice', [ 'Normal revert was chosen on ', Morebits.htmlNode('strong', userNorm), '. This is a trusted bot, but per confirmation, revert on selected revision will proceed.' ]);
					}
					break;
			}
		}
		var found = false;
		var count = 0;
		var seen64 = false;

		for (var i = index; i < revs.length; ++i) {
			++count;
			if (revs[i].user !== params.user) {
				// Treat ipv6 users on same 64 block as the same
				if (mw.util.isIPv6Address(revs[i].user) && Morebits.ip.get64(revs[i].user) === Morebits.ip.get64(params.user)) {
					if (!seen64) {
						new Morebits.status('Note', 'একই /৬৪ তে থাকা পরপর আইপি ভি৬ ঠিকানাগুলোকে একই ব্যবহারকারী গণ্য করা হচ্ছে।');
						seen64 = true;
					}
					continue;
				}
				found = i;
				break;
			}
		}

		if (!found) {
			statelem.error([ 'কোনো পূর্ববর্তী সংস্করণ পাওয়া যায়নি। হয়তো ', Morebits.htmlNode('strong', userNorm), ' পাতাটির একমাত্র সম্পাদক অথবা তিনি ' + mw.language.convertNumber(Twinkle.getPref('revertMaxRevisions')) + ' এরও অধিক সম্পাদনা করেছেন।' ]);
			return;
		}

		if (!count) {
			Morebits.status.error('Error', 'যেহেতু শূণ্যটি সম্পাদনা বাতিল করা অসম্ভব, আমরা পূর্বাবস্থায় ফেরত নেয়া থামাবো। হতে পারে সম্পাদনা ইতিমধ্যে বাতিল হয়েছে, তারপরও সংস্করণ আইডি সমান ছিল।');
			return;
		}

		var good_revision = revs[found];
		var userHasAlreadyConfirmedAction = false;
		if (params.type !== 'vand' && count > 1) {
			if (!confirm(userNorm + ' পরপর ' + mw.language.convertNumber(count) + ' টি সম্পাদনা করেছেন। আপনি কি নিশ্চিতভাবে সবগুলো বাতিল করে চান?')) {
				Morebits.status.info('Notice', 'পূর্বাবস্থায় ফেরত থামানো হচ্ছে');
				return;
			}
			userHasAlreadyConfirmedAction = true;
		}

		params.count = count;

		params.goodid = good_revision.revid;
		params.gooduser = good_revision.user;
		params.gooduserHidden = !!good_revision.userhidden;

		statelem.status([ ' revision ', Morebits.htmlNode('strong', params.goodid), ' that was made ', Morebits.htmlNode('strong', mw.language.convertNumber(count)), ' revisions ago by ', Morebits.htmlNode('strong', params.gooduserHidden ? Twinkle.fluff.hiddenName : params.gooduser) ]);

		var summary, extra_summary;
		switch (params.type) {
			case 'agf':
				extra_summary = prompt('সম্পাদনা সারাংশের জন্য ঐচ্ছিক মন্তব্য:                              ', '');  // padded out to widen prompt in Firefox
				if (extra_summary === null) {
					statelem.error('ব্যবহারকারী পূর্বাবস্থায় ফেরত বাতিল করেছেন');
					return;
				}
				userHasAlreadyConfirmedAction = true;

				summary = Twinkle.fluff.formatSummary('[[WP:AGF|আস্থা রেখে]] $USER-এর করা সম্পাদনা বাতিল',
					params.userHidden ? null : params.user, extra_summary);
				break;

			case 'vand':
				summary = Twinkle.fluff.formatSummary('$USER-এর করা ' + params.count + ' টি সম্পাদনা বাতিল করে ' +
					(params.gooduserHidden ? Twinkle.fluff.hiddenName : params.gooduser) + ' সম্পাদিত সর্বশেষ সংস্করণে ফেরত',
					params.userHidden ? null : params.user);
				break;

			case 'norm':
			/* falls through */
			default:
				if (Twinkle.getPref('offerReasonOnNormalRevert')) {
					extra_summary = prompt('সম্পাদনা সারাংশের জন্য ঐচ্ছিক মন্তব্য:                              ', '');  // padded out to widen prompt in Firefox
					if (extra_summary === null) {
						statelem.error('ব্যবহারকারী পূর্বাবস্থায় ফেরত বাতিল করেছেন');
						return;
					}
					userHasAlreadyConfirmedAction = true;
				}

				summary = Twinkle.fluff.formatSummary('$USER-এর করা ' + params.count + ' টি সম্পাদনা বাতিল',
					params.userHidden ? null : params.user, extra_summary);
				break;
		}

		if ((Twinkle.getPref('confirmOnFluff') ||
			// Mobile user agent taken from [[en:MediaWiki:Gadget-confirmationRollback-mobile.js]]
			(Twinkle.getPref('confirmOnMobileFluff') && /Android|webOS|iPhone|iPad|iPod|BlackBerry|Mobile|Opera Mini/i.test(navigator.userAgent))) &&
			!userHasAlreadyConfirmedAction && !confirm('আপনি কি নিশ্চিতভাবে পূর্বাবস্থায় ফেরত নিতে চান?')) {
			statelem.error('ব্যবহারকারী পূর্বাবস্থায় ফেরত বাতিল করেছেন');
			return;
		}

		// Decide whether to notify the user on success
		if (!Twinkle.fluff.skipTalk && Twinkle.getPref('openTalkPage').indexOf(params.type) !== -1 &&
				!params.userHidden && mw.config.get('wgUserName') !== params.user) {
			params.notifyUser = true;
			// Pass along to the warn module
			params.vantimestamp = top.timestamp;
		}

		// figure out whether we need to/can review the edit
		var flagged = page.flagged;
		if ((Morebits.userIsInGroup('reviewer') || Morebits.userIsSysop) &&
				!!flagged &&
				flagged.stable_revid >= params.goodid &&
				!!flagged.pending_since) {
			params.reviewRevert = true;
			params.csrftoken = csrftoken;
		}

		var query = {
			action: 'edit',
			title: params.pagename,
			summary: summary,
			tags: Twinkle.changeTags,
			token: csrftoken,
			undo: lastrevid,
			undoafter: params.goodid,
			basetimestamp: touched,
			starttimestamp: loadtimestamp,
			minor: Twinkle.getPref('markRevertedPagesAsMinor').indexOf(params.type) !== -1 ? true : undefined,
			format: 'json'
		};
		// Handle watching, possible expiry
		if (Twinkle.getPref('watchRevertedPages').indexOf(params.type) !== -1) {
			var watchOrExpiry = Twinkle.getPref('watchRevertedExpiry');

			if (!watchOrExpiry || watchOrExpiry === 'no') {
				query.watchlist = 'nochange';
			} else if (watchOrExpiry === 'default' || watchOrExpiry === 'preferences') {
				query.watchlist = 'preferences';
			} else {
				query.watchlist = 'watch';
				// number allowed but not used in Twinkle.config.watchlistEnums
				if ((!page.watched || page.watchlistexpiry) && typeof watchOrExpiry === 'string' && watchOrExpiry !== 'yes') {
					query.watchlistexpiry = watchOrExpiry;
				}
			}
		}

		if (!Twinkle.fluff.rollbackInPlace) {
			Morebits.wiki.actionCompleted.redirect = params.pagename;
		}
		Morebits.wiki.actionCompleted.notice = 'পূর্বাবস্থায় ফেরত সম্পন্ন';

		var wikipedia_api = new Morebits.wiki.api('ফেরত যাওয়া বিষয়বস্তু সংরক্ষণ করা হচ্ছে', query, Twinkle.fluff.callbacks.complete, statelem);
		wikipedia_api.params = params;
		wikipedia_api.post();

	},
	complete: function (apiobj) {
		// TODO Most of this is copy-pasted from Morebits.wiki.page#fnSaveSuccess. Unify it
		var response = apiobj.getResponse();
		var edit = response.edit;

		if (edit.captcha) {
			apiobj.statelem.error('রোলব্যাক করা যাচ্ছে না। কারণ উইকি সার্ভার চাচ্ছে আপনি ক্যাপচা পূরণ করুন।');
		} else if (edit.nochange) {
			apiobj.statelem.error('যে সংস্করণে আমরা ফেরত যাচ্ছি তা বর্তমান সংস্করণের অনুরূপ। পূর্বাবস্থায় ফেরত থামানো হচ্ছে।');
		} else {
			apiobj.statelem.info('সম্পন্ন');
			var params = apiobj.params;

			if (params.notifyUser && !params.userHidden) { // notifyUser only from main, not from toRevision
				Morebits.status.info('Info', [ 'ব্যবহারকারীর জন্য ব্যবহারকারী আলাপ পাতার সম্পাদনা ফরম খোলা হচ্ছে।', Morebits.htmlNode('strong', params.user) ]);

				var windowQuery = {
					title: 'User talk:' + params.user,
					action: 'edit',
					preview: 'yes',
					vanarticle: params.pagename.replace(/_/g, ' '),
					vanarticlerevid: params.revid,
					vantimestamp: params.vantimestamp,
					vanarticlegoodrevid: params.goodid,
					type: params.type,
					count: params.count
				};

				switch (Twinkle.getPref('userTalkPageMode')) {
					case 'tab':
						window.open(mw.util.getUrl('', windowQuery), '_blank');
						break;
					case 'blank':
						window.open(mw.util.getUrl('', windowQuery), '_blank',
							'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
					case 'window':
					/* falls through */
					default:
						window.open(mw.util.getUrl('', windowQuery),
							window.name === 'twinklewarnwindow' ? '_blank' : 'twinklewarnwindow',
							'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
				}
			}


			// review the revert, if needed
			if (apiobj.params.reviewRevert) {
				var query = {
					action: 'review',
					revid: edit.newrevid,
					token: apiobj.params.csrftoken,
					comment: 'স্বয়ংক্রিয় সংস্করণ নিরীক্ষণ' + Twinkle.summaryAd // until the below
					// 'tags': Twinkle.changeTags // flaggedrevs tag support: [[phab:T247721]]
				};
				var wikipedia_api = new Morebits.wiki.api('স্বয়ংক্রিয়ভাবে আপনার পরিবর্তন গ্রহণ করা হচ্ছে', query);
				wikipedia_api.post();
			}
		}
	}
};

// If builtInString contains the string "$USER", it will be replaced
// by an appropriate user link if a user name is provided
Twinkle.fluff.formatSummary = function(builtInString, userName, customString) {
	var result = builtInString;

	// append user's custom reason
	if (customString) {
		result += ': ' + Morebits.string.toUpperCaseFirstChar(customString);
	}

	// find number of UTF-8 bytes the resulting string takes up, and possibly add
	// a contributions or contributions+talk link if it doesn't push the edit summary
	// over the 499-byte limit
	if (/\$USER/.test(builtInString)) {
		if (userName) {
			var resultLen = unescape(encodeURIComponent(result.replace('$USER', ''))).length;
			var contribsLink = '[[Special:Contributions/' + userName + '|' + userName + ']]';
			var contribsLen = unescape(encodeURIComponent(contribsLink)).length;
			if (resultLen + contribsLen <= 499) {
				var talkLink = ' ([[User talk:' + userName + '|আলাপ]])';
				if (resultLen + contribsLen + unescape(encodeURIComponent(talkLink)).length <= 499) {
					result = Morebits.string.safeReplace(result, '$USER', contribsLink + talkLink);
				} else {
					result = Morebits.string.safeReplace(result, '$USER', contribsLink);
				}
			} else {
				result = Morebits.string.safeReplace(result, '$USER', userName);
			}
		} else {
			result = Morebits.string.safeReplace(result, '$USER', Twinkle.fluff.hiddenName);
		}
	}

	return result;
};

Twinkle.addInitCallback(Twinkle.fluff, 'fluff');
})(jQuery);


// </nowiki>
// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklediff.js: Diff module
 ****************************************
 * Mode of invocation:     Tab on non-diff pages ("Last"); tabs on diff pages ("Since", "Since mine", "Current")
 * Active on:              Existing non-special pages
 */

Twinkle.diff = function twinklediff() {
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}
	Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'cur', oldid: 'prev'}), 'সর্বশেষ', 'tw-lastdiff', 'সর্বশেষ পার্থক্য দেখুন');

	// Show additional tabs only on diff pages
	if (mw.util.getParamValue('diff')) {
		Twinkle.addPortletLink(function() {
			Twinkle.diff.evaluate(false);
		}, 'হতে', 'tw-since', 'সর্বশেষ সম্পাদনা পার্থক্য ও পূর্বের ব্যবহারকারীর সংস্করণের মধ্যে পার্থক্য দেখান');
		Twinkle.addPortletLink(function() {
			Twinkle.diff.evaluate(true);
		}, 'আমার থেকে', 'tw-sincemine', 'সর্বশেষ সম্পাদনা পার্থক্য ও আমার সর্বশেষ সংস্করণের পার্থক্য দেখান');

		var oldid = /oldid=(.+)/.exec($('#mw-diff-ntitle1').find('strong a').first().attr('href'))[1];
		Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'cur', oldid: oldid}), 'সাম্প্রতিক', 'tw-curdiff', 'সর্বশেষ সংস্করণের পার্থক্য দেখান');
	}
};

Twinkle.diff.evaluate = function twinklediffEvaluate(me) {

	var user;
	if (me) {
		user = mw.config.get('wgUserName');
	} else {
		var node = document.getElementById('mw-diff-ntitle2');
		if (!node) {
			// nothing to do?
			return;
		}
		user = $(node).find('a').first().text();
	}
	var query = {
		prop: 'revisions',
		action: 'query',
		titles: mw.config.get('wgPageName'),
		rvlimit: 1,
		rvprop: [ 'ids', 'user' ],
		rvstartid: mw.config.get('wgCurRevisionId') - 1, // i.e. not the current one
		rvuser: user,
		format: 'json'
	};
	Morebits.status.init(document.getElementById('mw-content-text'));
	var wikipedia_api = new Morebits.wiki.api('প্রাথমিক অবদানকারীর তথ্য সংগ্রহ করা হচ্ছে', query, Twinkle.diff.callbacks.main);
	wikipedia_api.params = { user: user };
	wikipedia_api.post();
};

Twinkle.diff.callbacks = {
	main: function(self) {
		var rev = self.response.query.pages[0].revisions;
		var revid = rev && rev[0].revid;

		if (!revid) {
			self.statelem.error('আগের কোন উপযুক্ত সংস্করণ পাওয়া যায়নি, অথবা ' + self.params.user + 'একমাত্র অবদানকারী। বাতিল করা হচ্ছে...');
			return;
		}
		window.location = mw.util.getUrl(mw.config.get('wgPageName'), {
			diff: mw.config.get('wgCurRevisionId'),
			oldid: revid
		});
	}
};

Twinkle.addInitCallback(Twinkle.diff, 'diff');
})(jQuery);


// </nowiki>

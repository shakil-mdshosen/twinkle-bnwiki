// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklebatchdelete.js: Batch delete module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("ব্যাচ অপসারণ")
 * Active on:              Existing non-articles, and Special:PrefixIndex
 */

Twinkle.batchdelete = function twinklebatchdelete() {
	if (
		Morebits.userIsSysop && (
			(mw.config.get('wgCurRevisionId') && mw.config.get('wgNamespaceNumber') > 0) ||
			mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex'
		)
	) {
		Twinkle.addPortletLink(Twinkle.batchdelete.callback, 'ব্যাচ অপসারণ', 'tw-batch', 'এই বিষয়শ্রেণী/পাতায় পাওয়া নিবন্ধ অপসারণ');
	}
};

Twinkle.batchdelete.unlinkCache = {};

// Has the subpages list been loaded?
var subpagesLoaded;

Twinkle.batchdelete.callback = function twinklebatchdeleteCallback() {
	subpagesLoaded = false;
	var Window = new Morebits.simpleWindow(600, 400);
	Window.setTitle('ব্যাচ অপসারণ');
	Window.setScriptName('টুইংকল');
	Window.addFooterLink('টুইংকল সাহায্য', 'WP:TW/DOC#batchdelete');
	Window.addFooterLink('প্রতিক্রিয়া প্রকাশ করুন', 'WT:TW');

	var form = new Morebits.quickForm(Twinkle.batchdelete.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'পাতাসমূহ অপসারণ করুন',
				name: 'delete_page',
				value: 'delete',
				checked: true,
				subgroup: {
					type: 'checkbox',
					list: [
						{
							label: 'সংশ্লিষ্ট আলাপ পাতাগুলো অপসারণ করুন (ব্যবহারকারী আলাপ পাতা ব্যতীত)',
							name: 'delete_talk',
							value: 'delete_talk',
							checked: true
						},
						{
							label: 'অপসারিত পাতাসমূহের পুনর্নির্দেশনাগুলো অপসারণ করুন',
							name: 'delete_redirects',
							value: 'delete_redirects',
							checked: true
						},
						{
							label: 'অপসারিত পাতাসমূহের উপপাতাগুলো অপসারণ করুন',
							name: 'delete_subpages',
							value: 'delete_subpages',
							checked: false,
							event: Twinkle.batchdelete.callback.toggleSubpages,
							subgroup: {
								type: 'checkbox',
								list: [
									{
										label: 'অপসারিত উপপাতাসমূহের আলাপ পাতাগুলো অপসারণ করুন',
										name: 'delete_subpage_talks',
										value: 'delete_subpage_talks'
									},
									{
										label: 'অপসারিত উপপাতাসমূহের পুনর্নির্দেশনাগুলো অপসারণ করুন',
										name: 'delete_subpage_redirects',
										value: 'delete_subpage_redirects'
									},
									{
										label: 'সকল অপসারিত উপপাতার পেছনসংযোগ সরান (শুধুমাত্র প্রবেশদ্বার এবং প্রধান নামস্থান থেকে)',
										name: 'unlink_subpages',
										value: 'unlink_subpages'
									}
								]
							}
						}
					]
				}
			},
			{
				label: 'সকল পাতার পেছনসংযোগ সরান (শুধুমাত্র প্রবেশদ্বার এবং প্রধান নামস্থান থেকে)',
				name: 'unlink_page',
				value: 'unlink',
				checked: false
			},
			{
				label: 'প্রতিটি ফাইলের ব্যবহার অপসারণ করুন (সকল নামস্থানে)',
				name: 'unlink_file',
				value: 'unlink_file',
				checked: true
			}
		]
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: 'কারণ:',
		size: 60
	});

	var query = {
		action: 'query',
		prop: 'revisions|info|imageinfo',
		inprop: 'protection',
		rvprop: 'size|user',
		format: 'json'
	};

	// On categories
	if (mw.config.get('wgNamespaceNumber') === 14) {
		query.generator = 'categorymembers';
		query.gcmtitle = mw.config.get('wgPageName');
		query.gcmlimit = Twinkle.getPref('batchMax');

	// On Special:PrefixIndex
	} else if (mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex') {

		query.generator = 'allpages';
		query.gaplimit = Twinkle.getPref('batchMax');
		if (mw.util.getParamValue('prefix')) {
			query.gapnamespace = mw.util.getParamValue('namespace');
			query.gapprefix = mw.util.getParamValue('prefix');
		} else {
			var pathSplit = decodeURIComponent(location.pathname).split('/');
			if (pathSplit.length < 3 || pathSplit[2] !== 'বিশেষ:উপসর্গ') {
				return;
			}
			var titleSplit = pathSplit[3].split(':');
			query.gapnamespace = mw.config.get('wgNamespaceIds')[titleSplit[0].toLowerCase()];
			if (titleSplit.length < 2 || typeof query.gapnamespace === 'undefined') {
				query.gapnamespace = 0;  // article namespace
				query.gapprefix = pathSplit.splice(3).join('/');
			} else {
				pathSplit = pathSplit.splice(4);
				pathSplit.splice(0, 0, titleSplit.splice(1).join(':'));
				query.gapprefix = pathSplit.join('/');
			}
		}

	// On normal pages
	} else {
		query.generator = 'links';
		query.titles = mw.config.get('wgPageName');
		query.gpllimit = Twinkle.getPref('batchMax');
	}

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	Twinkle.batchdelete.pages = {};

	var statelem = new Morebits.status('পাতাগুলোর তালিকা তৈরি করা হচ্ছে');
	var wikipedia_api = new Morebits.wiki.api('লোড হচ্ছে...', query, function(apiobj) {
		var response = apiobj.getResponse();
		var pages = (response.query && response.query.pages) || [];
		pages = pages.filter(function(page) {
			return !page.missing && page.imagerepository !== 'shared';
		});
		pages.sort(Twinkle.sortByNamespace);
		pages.forEach(function(page) {
			var metadata = [];
			if (page.redirect) {
				metadata.push('পুনর্নির্দেশনা');
			}

			var editProt = page.protection.filter(function(pr) {
				return pr.type === 'edit' && pr.level === 'sysop';
			}).pop();
			if (editProt) {
				metadata.push('সম্পূর্ণ সুরক্ষিত' +
				(editProt.expiry === 'infinity' ? ' indefinitely' : ', expires ' + new Morebits.date(editProt.expiry).calendar('utc') + ' (ইউটিসি)'));
			}

			if (page.ns === 6) {
				metadata.push('আপলোডকারী: ' + page.imageinfo[0].user);
				metadata.push('সর্বশেষ সম্পাদনাকারী: ' + page.revisions[0].user);
			} else {
				metadata.push(mw.language.convertNumber(page.revisions[0].size) + ' বাইট');
			}

			var title = page.title;
			Twinkle.batchdelete.pages[title] = {
				label: title + (metadata.length ? ' (' + metadata.join('; ') + ')' : ''),
				value: title,
				checked: true,
				style: editProt ? 'color:red' : ''
			};
		});

		var form = apiobj.params.form;
		form.append({ type: 'header', label: 'অপসারণযোগ্য পাতা' });
		form.append({
			type: 'button',
			label: 'সব বাছাই করুন',
			event: function dBatchSelectAll() {
				$(result).find('input[name=pages]:not(:checked)').each(function(_, e) {
					e.click(); // check it, and invoke click event so that subgroup can be shown
				});

				// Check any unchecked subpages too
				$('input[name="pages.subpages"]').prop('checked', true);
			}
		});
		form.append({
			type: 'button',
			label: 'সব বাছাই সরান',
			event: function dBatchDeselectAll() {
				$(result).find('input[name=pages]:checked').each(function(_, e) {
					e.click(); // uncheck it, and invoke click event so that subgroup can be hidden
				});
			}
		});
		form.append({
			type: 'checkbox',
			name: 'pages',
			id: 'tw-dbatch-pages',
			shiftClickSupport: true,
			list: $.map(Twinkle.batchdelete.pages, function (e) {
				return e;
			})
		});
		form.append({ type: 'submit' });

		var result = form.render();
		apiobj.params.Window.setContent(result);

		Morebits.quickForm.getElements(result, 'pages').forEach(Twinkle.generateArrowLinks);

	}, statelem);

	wikipedia_api.params = { form: form, Window: Window };
	wikipedia_api.post();
};

Twinkle.batchdelete.generateNewPageList = function(form) {

	// Update the list of checked pages in Twinkle.batchdelete.pages object
	var elements = form.elements.pages;
	if (elements instanceof NodeList) { // if there are multiple pages
		for (var i = 0; i < elements.length; ++i) {
			Twinkle.batchdelete.pages[elements[i].value].checked = elements[i].checked;
		}
	} else if (elements instanceof HTMLInputElement) { // if there is just one page
		Twinkle.batchdelete.pages[elements.value].checked = elements.checked;
	}

	return new Morebits.quickForm.element({
		type: 'checkbox',
		name: 'pages',
		id: 'tw-dbatch-pages',
		shiftClickSupport: true,
		list: $.map(Twinkle.batchdelete.pages, function (e) {
			return e;
		})
	}).render();
};

Twinkle.batchdelete.callback.toggleSubpages = function twDbatchToggleSubpages(e) {

	var form = e.target.form;
	var newPageList;

	if (e.target.checked) {

		form.delete_subpage_redirects.checked = form.delete_redirects.checked;
		form.delete_subpage_talks.checked = form.delete_talk.checked;
		form.unlink_subpages.checked = form.unlink_page.checked;

		// If lists of subpages were already loaded once, they are
		// available without use of any API calls
		if (subpagesLoaded) {

			$.each(Twinkle.batchdelete.pages, function(i, el) {
				// Get back the subgroup from subgroup_, where we saved it
				if (el.subgroup === null && el.subgroup_) {
					el.subgroup = el.subgroup_;
				}
			});

			newPageList = Twinkle.batchdelete.generateNewPageList(form);
			$('#tw-dbatch-pages').replaceWith(newPageList);

			Morebits.quickForm.getElements(newPageList, 'pages').forEach(Twinkle.generateArrowLinks);
			Morebits.quickForm.getElements(newPageList, 'pages.subpages').forEach(Twinkle.generateArrowLinks);

			return;
		}

		// Proceed with API calls to get list of subpages
		var loadingText = '<strong id="dbatch-subpage-loading">Loading... </strong>';
		$(e.target).after(loadingText);

		var pages = $(form.pages).map(function(i, el) {
			return el.value;
		}).get();

		var subpageLister = new Morebits.batchOperation();
		subpageLister.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		subpageLister.setPageList(pages);
		subpageLister.run(function worker (pageName) {
			var pageTitle = mw.Title.newFromText(pageName);

			// No need to look for subpages in main/file/mediawiki space
			if ([0, 6, 8].indexOf(pageTitle.namespace) > -1) {
				subpageLister.workerSuccess();
				return;
			}

			var wikipedia_api = new Morebits.wiki.api(pageName + ' পাতার উপপাতাগুলোর তালিকা তৈরি করা হচ্ছে', {
				action: 'query',
				prop: 'revisions|info|imageinfo',
				generator: 'allpages',
				rvprop: 'size',
				inprop: 'protection',
				gapprefix: pageTitle.title + '/',
				gapnamespace: pageTitle.namespace,
				gaplimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			}, function onSuccess(apiobj) {
				var response = apiobj.getResponse();
				var pages = (response.query && response.query.pages) || [];
				var subpageList = [];
				pages.sort(Twinkle.sortByNamespace);
				pages.forEach(function(page) {
					var metadata = [];
					if (page.redirect) {
						metadata.push('পুনর্নির্দেশনা');
					}

					var editProt = page.protection.filter(function(pr) {
						return pr.type === 'edit' && pr.level === 'sysop';
					}).pop();
					if (editProt) {
						metadata.push('সম্পূর্ণ সুরক্ষিত' +
						(editProt.expiry === 'infinity' ? ' indefinitely' : ', expires ' + new Morebits.date(editProt.expiry).calendar('utc') + ' (ইউটিসি)'));
					}
					if (page.ns === 6) {
						metadata.push('আপলোডকারী: ' + page.imageinfo[0].user);
						metadata.push('সর্বশেষ সম্পাদনাকারী: ' + page.revisions[0].user);
					} else {
						metadata.push(mw.language.convertNumber(page.revisions[0].size) + ' bytes');
					}

					var title = page.title;
					subpageList.push({
						label: title + (metadata.length ? ' (' + metadata.join('; ') + ')' : ''),
						value: title,
						checked: true,
						style: editProt ? 'color:red' : ''
					});
				});
				if (subpageList.length) {
					var pageName = apiobj.params.pageNameFull;
					Twinkle.batchdelete.pages[pageName].subgroup = {
						type: 'checkbox',
						name: 'subpages',
						className: 'dbatch-subpages',
						shiftClickSupport: true,
						list: subpageList
					};
				}
				subpageLister.workerSuccess();
			}, null /* statusElement */, function onFailure() {
				subpageLister.workerFailure();
			});
			wikipedia_api.params = { pageNameFull: pageName }; // Used in onSuccess()
			wikipedia_api.post();

		}, function postFinish () {
			// List 'em on the interface

			newPageList = Twinkle.batchdelete.generateNewPageList(form);
			$('#tw-dbatch-pages').replaceWith(newPageList);

			Morebits.quickForm.getElements(newPageList, 'pages').forEach(Twinkle.generateArrowLinks);
			Morebits.quickForm.getElements(newPageList, 'pages.subpages').forEach(Twinkle.generateArrowLinks);

			subpagesLoaded = true;

			// Remove "Loading... " text
			$('#dbatch-subpage-loading').remove();

		});

	} else if (!e.target.checked) {

		$.each(Twinkle.batchdelete.pages, function(i, el) {
			if (el.subgroup) {
				// Remove subgroup after saving its contents in subgroup_
				// so that it can be retrieved easily if user decides to
				// delete the subpages again
				el.subgroup_ = el.subgroup;
				el.subgroup = null;
			}
		});

		newPageList = Twinkle.batchdelete.generateNewPageList(form);
		$('#tw-dbatch-pages').replaceWith(newPageList);

		Morebits.quickForm.getElements(newPageList, 'pages').forEach(Twinkle.generateArrowLinks);
	}
};

Twinkle.batchdelete.callback.evaluate = function twinklebatchdeleteCallbackEvaluate(event) {
	Morebits.wiki.actionCompleted.notice = 'ব্যাচ অপসারণ নিষ্পন্ন হয়েছে';

	var form = event.target;

	var numProtected = $(Morebits.quickForm.getElements(form, 'pages')).filter(function(index, element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('আপনি ' + mw.language.convertNumber(numProtected) + ' টি সম্পূর্ণ সুরক্ষিত পাতা অপসারণ করতে চলেছেন। আপনি কি এ ব্যাপারে নিশ্চিত?')) {
		return;
	}

	var input = Morebits.quickForm.getInputData(form);

	if (!input.reason) {
		alert('আপনাকে একটি কারণ প্রদান করতে হবে');
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);
	if (input.pages.length === 0) {
		Morebits.status.error('Error', 'অপসারণ করার কিছু নেই, বাতিল করা হচ্ছে');
		return;
	}

	var pageDeleter = new Morebits.batchOperation(input.delete_page ? 'Deleting pages' : 'Initiating requested tasks');
	pageDeleter.setOption('chunkSize', Twinkle.getPref('batchChunks'));
	// we only need the initial status lines if we're deleting the pages in the pages array
	pageDeleter.setOption('preserveIndividualStatusLines', input.delete_page);
	pageDeleter.setPageList(input.pages);
	pageDeleter.run(function worker(pageName) {
		var params = {
			page: pageName,
			delete_page: input.delete_page,
			delete_talk: input.delete_talk,
			delete_redirects: input.delete_redirects,
			unlink_page: input.unlink_page,
			unlink_file: input.unlink_file && new RegExp('^' + Morebits.namespaceRegex(6) + ':', 'i').test(pageName),
			reason: input.reason,
			pageDeleter: pageDeleter
		};

		var wikipedia_page = new Morebits.wiki.page(pageName, pageName + ' পাতা অপসারণ করা হচ্ছে');
		wikipedia_page.setCallbackParameters(params);
		if (input.delete_page) {
			wikipedia_page.setEditSummary(input.reason);
			wikipedia_page.setChangeTags(Twinkle.changeTags);
			wikipedia_page.suppressProtectWarning();
			wikipedia_page.deletePage(Twinkle.batchdelete.callbacks.doExtras, pageDeleter.workerFailure);
		} else {
			Twinkle.batchdelete.callbacks.doExtras(wikipedia_page);
		}
	}, function postFinish() {
		if (input.delete_subpages && input.subpages) {
			var subpageDeleter = new Morebits.batchOperation('Deleting subpages');
			subpageDeleter.setOption('chunkSize', Twinkle.getPref('batchChunks'));
			subpageDeleter.setOption('preserveIndividualStatusLines', true);
			subpageDeleter.setPageList(input.subpages);
			subpageDeleter.run(function(pageName) {
				var params = {
					page: pageName,
					delete_page: true,
					delete_talk: input.delete_subpage_talks,
					delete_redirects: input.delete_subpage_redirects,
					unlink_page: input.unlink_subpages,
					unlink_file: false,
					reason: input.reason,
					pageDeleter: subpageDeleter
				};

				var wikipedia_page = new Morebits.wiki.page(pageName, pageName + ' উপপাতা অপসারণ করা হচ্ছে');
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.setEditSummary(input.reason);
				wikipedia_page.setChangeTags(Twinkle.changeTags);
				wikipedia_page.suppressProtectWarning();
				wikipedia_page.deletePage(Twinkle.batchdelete.callbacks.doExtras, pageDeleter.workerFailure);
			});
		}
	});
};

Twinkle.batchdelete.callbacks = {
	// this stupid parameter name is a temporary thing until I implement an overhaul
	// of Morebits.wiki.* callback parameters
	doExtras: function(thingWithParameters) {
		var params = thingWithParameters.parent ? thingWithParameters.parent.getCallbackParameters() :
			thingWithParameters.getCallbackParameters();
		// the initial batch operation's job is to delete the page, and that has
		// succeeded by now
		params.pageDeleter.workerSuccess(thingWithParameters);

		var query, wikipedia_api;

		if (params.unlink_page) {
			Twinkle.batchdelete.unlinkCache = {};
			query = {
				action: 'query',
				list: 'backlinks',
				blfilterredir: 'nonredirects',
				blnamespace: [0, 100], // main space and portal space only
				bltitle: params.page,
				bllimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			};
			wikipedia_api = new Morebits.wiki.api('পেছনসংযোগগুলো আনা হচ্ছে', query, Twinkle.batchdelete.callbacks.unlinkBacklinksMain);
			wikipedia_api.params = params;
			wikipedia_api.post();
		}

		if (params.unlink_file) {
			query = {
				action: 'query',
				list: 'imageusage',
				iutitle: params.page,
				iulimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
				format: 'json'
			};
			wikipedia_api = new Morebits.wiki.api('ফাইলের লিংক আনা হচ্ছে', query, Twinkle.batchdelete.callbacks.unlinkImageInstancesMain);
			wikipedia_api.params = params;
			wikipedia_api.post();
		}

		if (params.delete_page) {
			if (params.delete_redirects) {
				query = {
					action: 'query',
					titles: params.page,
					prop: 'redirects',
					rdlimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
					format: 'json'
				};
				wikipedia_api = new Morebits.wiki.api('পুনর্নির্দেশনাগুলো আনা হচ্ছে', query, Twinkle.batchdelete.callbacks.deleteRedirectsMain);
				wikipedia_api.params = params;
				wikipedia_api.post();
			}
			if (params.delete_talk) {
				var pageTitle = mw.Title.newFromText(params.page);
				if (pageTitle && pageTitle.namespace % 2 === 0 && pageTitle.namespace !== 2) {
					pageTitle.namespace++;  // now pageTitle is the talk page title!
					query = {
						action: 'query',
						titles: pageTitle.toText(),
						format: 'json'
					};
					wikipedia_api = new Morebits.wiki.api('আলাপ পাতার অস্তিত্ব আছে কিনা দেখা হচ্ছে', query, Twinkle.batchdelete.callbacks.deleteTalk);
					wikipedia_api.params = params;
					wikipedia_api.params.talkPage = pageTitle.toText();
					wikipedia_api.post();
				}
			}
		}
	},
	deleteRedirectsMain: function(apiobj) {
		var response = apiobj.getResponse();
		var pages = response.query.pages[0].redirects || [];
		pages = pages.map(function(redirect) {
			return redirect.title;
		});
		if (!pages.length) {
			return;
		}

		var redirectDeleter = new Morebits.batchOperation(apiobj.params.page + ' পাতার পুনর্নির্দেশনাগুলো অপসারণ করা হচ্ছে');
		redirectDeleter.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		redirectDeleter.setPageList(pages);
		redirectDeleter.run(function(pageName) {
			var wikipedia_page = new Morebits.wiki.page(pageName, pageName + ' অপসারণ করা হচ্ছে');
			wikipedia_page.setEditSummary('[[WP:স৮|স৮]]: অপসারিত পাতার পুনর্নির্দেশনা "' + apiobj.params.page + '"');
			wikipedia_page.setChangeTags(Twinkle.changeTags);
			wikipedia_page.deletePage(redirectDeleter.workerSuccess, redirectDeleter.workerFailure);
		});
	},
	deleteTalk: function(apiobj) {
		var response = apiobj.getResponse();

		// no talk page; forget about it
		if (response.query.pages[0].missing) {
			return;
		}

		var page = new Morebits.wiki.page(apiobj.params.talkPage, apiobj.params.page + ' পাতার আলাপ পাতা অপসারণ করা হচ্ছে');
		page.setEditSummary('[[WP:স৮|স৮]]: অপসারিত পাতার [[উইকিপিডিয়া:আলাপ পাতার নির্দেশাবলী|আলাপ পাতা]] "' + apiobj.params.page + '"');
		page.setChangeTags(Twinkle.changeTags);
		page.deletePage();
	},
	unlinkBacklinksMain: function(apiobj) {
		var response = apiobj.getResponse();
		var pages = response.query.backlinks || [];
		pages = pages.map(function(page) {
			return page.title;
		});
		if (!pages.length) {
			return;
		}

		var unlinker = new Morebits.batchOperation('Unlinking backlinks to ' + apiobj.params.page);
		unlinker.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		unlinker.setPageList(pages);
		unlinker.run(function(pageName) {
			var wikipedia_page = new Morebits.wiki.page(pageName, 'Unlinking on ' + pageName);
			var params = $.extend({}, apiobj.params);
			params.title = pageName;
			params.unlinker = unlinker;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.batchdelete.callbacks.unlinkBacklinks);
		});
	},
	unlinkBacklinks: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		if (!pageobj.exists()) {
			// we probably just deleted it, as a recursive backlink
			params.unlinker.workerSuccess(pageobj);
			return;
		}

		var text;
		if (params.title in Twinkle.batchdelete.unlinkCache) {
			text = Twinkle.batchdelete.unlinkCache[params.title];
		} else {
			text = pageobj.getPageText();
		}
		var old_text = text;
		var wikiPage = new Morebits.wikitext.page(text);
		text = wikiPage.removeLink(params.page).getText();

		Twinkle.batchdelete.unlinkCache[params.title] = text;
		if (text === old_text) {
			// Nothing to do, return
			params.unlinker.workerSuccess(pageobj);
			return;
		}
		pageobj.setEditSummary(params.page + ' অপসারিত পাতার সংযোগ(সমূহ) সরানো হচ্ছে');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setPageText(text);
		pageobj.setCreateOption('nocreate');
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	},
	unlinkImageInstancesMain: function(apiobj) {
		var response = apiobj.getResponse();
		var pages = response.query.imageusage || [];
		pages = pages.map(function(page) {
			return page.title;
		});
		if (!pages.length) {
			return;
		}

		var unlinker = new Morebits.batchOperation(apiobj.params.page + ' পাতার পেছনসংযোগগুলো সরানো হচ্ছে');
		unlinker.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		unlinker.setPageList(pages);
		unlinker.run(function(pageName) {
			var wikipedia_page = new Morebits.wiki.page(pageName, pageName + ' পাতার ফাইলের ব্যবহার সরানো হচ্ছে');
			var params = $.extend({}, apiobj.params);
			params.title = pageName;
			params.unlinker = unlinker;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.batchdelete.callbacks.unlinkImageInstances);
		});
	},
	unlinkImageInstances: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		if (!pageobj.exists()) {
			// we probably just deleted it, as a recursive backlink
			params.unlinker.workerSuccess(pageobj);
			return;
		}

		var image = params.page.replace(new RegExp('^' + Morebits.namespaceRegex(6) + ':'), '');
		var text;
		if (params.title in Twinkle.batchdelete.unlinkCache) {
			text = Twinkle.batchdelete.unlinkCache[params.title];
		} else {
			text = pageobj.getPageText();
		}
		var old_text = text;
		var wikiPage = new Morebits.wikitext.page(text);
		text = wikiPage.commentOutImage(image, 'চিত্র অপসারিত হওয়ায় কোড কমেন্টে পরিণত করা হয়েছে').getText();

		Twinkle.batchdelete.unlinkCache[params.title] = text;
		if (text === old_text) {
			pageobj.getStatusElement().error('failed to unlink image ' + image + ' from ' + pageobj.getPageName());
			params.unlinker.workerFailure(pageobj);
			return;
		}
		pageobj.setEditSummary(image + ' ফাইলের ব্যবহার সরানো হচ্ছে, যা অপসারিত হওয়ার কারণ হলো "' + params.reason + '")');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setPageText(text);
		pageobj.setCreateOption('nocreate');
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	}
};

Twinkle.addInitCallback(Twinkle.batchdelete, 'batchdelete');
})(jQuery);


// </nowiki>

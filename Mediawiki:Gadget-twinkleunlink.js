// <nowiki>

(function ($) {
  /*
   ****************************************
   *** twinkleunlink.js: Unlink module
   ****************************************
   * Mode of invocation:     Tab ("সংযোগহীন")
   * Active on:              Non-special pages, except Wikipedia:Sandbox
   */

  Twinkle.unlink = function twinkleunlink() {
    if (
      mw.config.get("wgNamespaceNumber") < 0 ||
      mw.config.get("wgPageName") === "উইকিপিডিয়া:খেলাঘর" ||
      // Restrict to extended confirmed users (see #428)
      (!Morebits.userIsInGroup("extendedconfirmed") && !Morebits.userIsSysop)
    ) {
      return;
    }
    Twinkle.addPortletLink(
      Twinkle.unlink.callback,
      "সংযোগহীন",
      "tw-unlink",
      "পেছনসংযোগ সংযোগহীন করুন"
    );
  };

  // the parameter is used when invoking unlink from admin speedy
  Twinkle.unlink.callback = function (presetReason) {
    var fileSpace = mw.config.get("wgNamespaceNumber") === 6;

    var Window = new Morebits.simpleWindow(600, 440);
    Window.setTitle(
      "পেছনসংযোগ সংযোগহীন করুন " + (fileSpace ? " এবং ফাইলের ব্যবহার" : "")
    );
    Window.setScriptName("টুইংকল");
    Window.addFooterLink("পছন্দ", "WP:TW/PREF#unlink");
    Window.addFooterLink("টুইংকল সাহায্য", "WP:TW/DOC#unlink");
    Window.addFooterLink("প্রতিক্রিয়া জানান", "WT:TW");

    var form = new Morebits.quickForm(Twinkle.unlink.callback.evaluate);

    // prepend some documentation: files are commented out, while any
    // display text is preserved for links (otherwise the link itself is used)
    var linkTextBefore = Morebits.htmlNode(
      "code",
      "[[" + (fileSpace ? ":" : "") + Morebits.pageNameNorm + "|সংযোগের লেখা]]"
    );
    var linkTextAfter = Morebits.htmlNode("code", "সংযোগের লেখা");
    var linkPlainBefore = Morebits.htmlNode(
      "code",
      "[[" + Morebits.pageNameNorm + "]]"
    );
    var linkPlainAfter;
    if (fileSpace) {
      linkPlainAfter = Morebits.htmlNode(
        "code",
        "<!-- [[" + Morebits.pageNameNorm + "]] -->"
      );
    } else {
      linkPlainAfter = Morebits.htmlNode("code", Morebits.pageNameNorm);
    }

    form.append({
      type: "div",
      style: "margin-bottom: 0.5em",
      label: [
        'এই সরঞ্জাম এই পাতায় আসা অন্য পাতার সকল সংযোগ ("ব্যাকলিংক") সংযোগহীন করবে' +
          (fileSpace
            ? ",এবং/অথবা এই ফাইলের সমস্ত অন্তর্ভুক্তিগুলিকে মন্তব্য মার্কআপ (<!-- -->) এর মাধ্যমে লুকান"
            : "") +
          "। উদাহরণস্বরূপ, ",
        linkTextBefore,
        " হবে ",
        linkTextAfter,
        " এবং ",
        linkPlainBefore,
        " হবে ",
        linkPlainAfter,
        "। সতর্কতার সাথে এটি ব্যবহার করুন।",
      ],
    });

    form.append({
      type: "input",
      name: "reason",
      label: "কারণ:",
      value: presetReason ? presetReason : "",
      size: 60,
    });

    var query = {
      action: "query",
      list: "backlinks",
      bltitle: mw.config.get("wgPageName"),
      bllimit: "max", // 500 is max for normal users, 5000 for bots and sysops
      blnamespace: Twinkle.getPref("unlinkNamespaces"),
      rawcontinue: true,
      format: "json",
    };
    if (fileSpace) {
      query.list += "|imageusage";
      query.iutitle = query.bltitle;
      query.iulimit = query.bllimit;
      query.iunamespace = query.blnamespace;
    } else {
      query.blfilterredir = "nonredirects";
    }
    var wikipedia_api = new Morebits.wiki.api(
      "Grabbing backlinks",
      query,
      Twinkle.unlink.callbacks.display.backlinks
    );
    wikipedia_api.params = { form: form, Window: Window, image: fileSpace };
    wikipedia_api.post();

    var root = document.createElement("div");
    root.style.padding = "15px"; // just so it doesn't look broken
    Morebits.status.init(root);
    wikipedia_api.statelem.status("loading...");
    Window.setContent(root);
    Window.display();
  };

  Twinkle.unlink.callback.evaluate = function twinkleunlinkCallbackEvaluate(
    event
  ) {
    var form = event.target;
    var input = Morebits.quickForm.getInputData(form);

    if (!input.reason) {
      alert("আপনাকে অবশ্যই সংযোগহীন করার কারণ উল্লেখ করতে হবে।");
      return;
    }

    input.backlinks = input.backlinks || [];
    input.imageusage = input.imageusage || [];
    var pages = Morebits.array.uniq(input.backlinks.concat(input.imageusage));
    if (!pages.length) {
      alert("সংযোগহীন করতে আপনাকে কমপক্ষে একটি আইটেম নির্বাচন করতে হবে।");
      return;
    }

    Morebits.simpleWindow.setButtonsEnabled(false);
    Morebits.status.init(form);

    var unlinker = new Morebits.batchOperation(
      "সংযোগহীন করা হচ্ছে " +
        (input.backlinks.length
          ? "backlinks" +
            (input.imageusage.length ? " এবং ফাইল ব্যবহারের উদাহরণ" : "")
          : "এবং ফাইল ব্যবহারের উদাহরণ")
    );
    unlinker.setOption("preserveIndividualStatusLines", true);
    unlinker.setPageList(pages);
    var params = { reason: input.reason, unlinker: unlinker };
    unlinker.run(function (pageName) {
      var wikipedia_page = new Morebits.wiki.page(
        pageName,
        '"' + pageName + '" পাতাটি সংযোগহীন করা হচ্ছে।'
      );
      wikipedia_page.setBotEdit(true); // unlink considered a floody operation
      wikipedia_page.setCallbackParameters(
        $.extend(
          {
            doBacklinks: input.backlinks.indexOf(pageName) !== -1,
            doImageusage: input.imageusage.indexOf(pageName) !== -1,
          },
          params
        )
      );
      wikipedia_page.load(Twinkle.unlink.callbacks.unlinkBacklinks);
    });
  };

  Twinkle.unlink.callbacks = {
    display: {
      backlinks: function twinkleunlinkCallbackDisplayBacklinks(apiobj) {
        var response = apiobj.getResponse();
        var havecontent = false;
        var list, namespaces, i;

        if (apiobj.params.image) {
          var imageusage = response.query.imageusage.sort(
            Twinkle.sortByNamespace
          );
          list = [];
          for (i = 0; i < imageusage.length; ++i) {
            // Label made by Twinkle.generateBatchPageLinks
            list.push({ label: "", value: imageusage[i].title, checked: true });
          }
          if (!list.length) {
            apiobj.params.form.append({
              type: "div",
              label: "ফাইল ব্যবহারের কোনো দৃষ্টান্ত পাওয়া যায়নি।",
            });
          } else {
            apiobj.params.form.append({
              type: "header",
              label: "ফাইলের ব্যবহারসমূহ",
            });
            namespaces = [];
            $.each(Twinkle.getPref("unlinkNamespaces"), function (k, v) {
              namespaces.push(
                v === "0"
                  ? "নিবন্ধ"
                  : mw.config.get("wgFormattedNamespaces")[v]
              );
            });
            apiobj.params.form.append({
              type: "div",
              label: "নির্বাচন করুন: " + namespaces.join(", "),
              tooltip:
                "আপনি আপনার টুইংকল পছন্দে ([[WP:TWPREFS]]) এটি পরিবর্তন করতে পারেন, ",
            });
            if (
              response["query-continue"] &&
              response["query-continue"].imageusage
            ) {
              apiobj.params.form.append({
                type: "div",
                label:
                  "প্রথম" +
                  mw.language.convertNumber(list.length) +
                  "ফাইলের ব্যবহারটি দেখানো হলো।",
              });
            }
            apiobj.params.form.append({
              type: "button",
              label: "সবগুলো নির্বাচিত করুন",
              event: function (e) {
                $(
                  Morebits.quickForm.getElements(e.target.form, "imageusage")
                ).prop("checked", true);
              },
            });
            apiobj.params.form.append({
              type: "button",
              label: "সবগুলো থেকে নির্বাচন সরান",
              event: function (e) {
                $(
                  Morebits.quickForm.getElements(e.target.form, "imageusage")
                ).prop("checked", false);
              },
            });
            apiobj.params.form.append({
              type: "checkbox",
              name: "imageusage",
              shiftClickSupport: true,
              list: list,
            });
            havecontent = true;
          }
        }

        var backlinks = response.query.backlinks.sort(Twinkle.sortByNamespace);
        if (backlinks.length > 0) {
          list = [];
          for (i = 0; i < backlinks.length; ++i) {
            // Label made by Twinkle.generateBatchPageLinks
            list.push({ label: "", value: backlinks[i].title, checked: true });
          }
          apiobj.params.form.append({ type: "header", label: "পেছনসংযোগ" });
          namespaces = [];
          $.each(Twinkle.getPref("unlinkNamespaces"), function (k, v) {
            namespaces.push(
              v === "0"
                ? "নিবন্ধ"
                : mw.config.get("wgFormattedNamespaces")[v]
            );
          });
          apiobj.params.form.append({
            type: "div",
            label: "নির্বাচনগুলো হলো: " + namespaces.join(", "),
            tooltip:
              "আপনি আপনার টুইংকল পছন্দে এটি পরিবর্তন করতে পারেন। টুইংকল উইন্ডো এর নিচে এটি দেওয়া আছে।",
          });
          if (
            response["query-continue"] &&
            response["query-continue"].backlinks
          ) {
            apiobj.params.form.append({
              type: "div",
              label:
                "প্রথম" +
                mw.language.convertNumber(list.length) +
                "পেছনসংযোগটি দেখানো হলো।",
            });
          }
          apiobj.params.form.append({
            type: "button",
            label: "সবগুলো নির্বাচিত করুন",
            event: function (e) {
              $(
                Morebits.quickForm.getElements(e.target.form, "backlinks")
              ).prop("checked", true);
            },
          });
          apiobj.params.form.append({
            type: "button",
            label: "সবগুলো থেকে নির্বাচন সরান",
            event: function (e) {
              $(
                Morebits.quickForm.getElements(e.target.form, "backlinks")
              ).prop("checked", false);
            },
          });
          apiobj.params.form.append({
            type: "checkbox",
            name: "backlinks",
            shiftClickSupport: true,
            list: list,
          });
          havecontent = true;
        } else {
          apiobj.params.form.append({
            type: "div",
            label: "কোন পেছনসংযোগ পাওয়া যায় নি।",
          });
        }

        if (havecontent) {
          apiobj.params.form.append({ type: "submit" });
        }

        var result = apiobj.params.form.render();
        apiobj.params.Window.setContent(result);

        Morebits.quickForm
          .getElements(result, "backlinks")
          .forEach(Twinkle.generateBatchPageLinks);
        Morebits.quickForm
          .getElements(result, "imageusage")
          .forEach(Twinkle.generateBatchPageLinks);
      },
    },
    unlinkBacklinks: function twinkleunlinkCallbackUnlinkBacklinks(pageobj) {
      var oldtext = pageobj.getPageText();
      var params = pageobj.getCallbackParameters();
      var wikiPage = new Morebits.wikitext.page(oldtext);

      var summaryText = "",
        warningString = false;
      var text;

      // remove image usages
      if (params.doImageusage) {
        text = wikiPage
          .commentOutImage(mw.config.get("wgTitle"), "মন্তব্যে পরিণত করা হয়েছে")
          .getText();
        // did we actually make any changes?
        if (text === oldtext) {
          warningString = "ফাইলের ব্যবহারসমূহ";
        } else {
          summaryText =
            "ফাইলের ব্যবহার বা ব্যবহারসমূহকে মন্তব্যে পরিণত করা হচ্ছে।"; //Commenting out use(s) of file
          oldtext = text;
        }
      }

      // remove backlinks
      if (params.doBacklinks) {
        text = wikiPage.removeLink(Morebits.pageNameNorm).getText();
        // did we actually make any changes?
        if (text === oldtext) {
          warningString = warningString
            ? "পেছনসংযোগ বা ফাইলের ব্যবহার"
            : "পেছনসংযোগসমূহ";
        } else {
          summaryText =
            (summaryText ? summaryText + " / " : "") +
            "লিংকগুলোকে অপসারণ করা হচ্ছে";
          oldtext = text;
        }
      }

      if (warningString) {
        // nothing to do!
        pageobj
          .getStatusElement()
          .error("এই পৃষ্ঠায় " + warningString + " খুঁজে পাওয়া যায়নি।");
        params.unlinker.workerFailure(pageobj);
        return;
      }

      pageobj.setPageText(text);
      pageobj.setEditSummary(
        summaryText + ' "' + Morebits.pageNameNorm + '": ' + params.reason + "।"
      );
      pageobj.setChangeTags(Twinkle.changeTags);
      pageobj.setCreateOption("nocreate");
      pageobj.save(
        params.unlinker.workerSuccess,
        params.unlinker.workerFailure
      );
    },
  };

  Twinkle.addInitCallback(Twinkle.unlink, "unlink");
})(jQuery);

// </nowiki>

// <nowiki>

(function ($) {


  /*
   ****************************************
   *** twinklebatchundelete.js: Batch undelete module
   ****************************************
   * Mode of invocation:     Tab ("ব্যাচ পুনরুদ্ধার")
   * Active on:              Existing user and project pages
   */


  Twinkle.batchundelete = function twinklebatchundelete() {
    if (
      !Morebits.userIsSysop ||
      !mw.config.get("wgArticleId") ||
      (mw.config.get("wgNamespaceNumber") !==
        mw.config.get("wgNamespaceIds").user &&
        mw.config.get("wgNamespaceNumber") !==
          mw.config.get("wgNamespaceIds").project)
    ) {
      return;
    }
    Twinkle.addPortletLink(
      Twinkle.batchundelete.callback,
      "ব্যাচ পুনরুদ্ধার",
      "tw-batch-undel",
      "সব পুনরুদ্ধার করুন"
    );
  };

  Twinkle.batchundelete.callback = function twinklebatchundeleteCallback() {
    var Window = new Morebits.simpleWindow(600, 400);
    Window.setScriptName("টুইংকেল");
    Window.setTitle("ব্যাচ পুনরুদ্ধার");
    Window.addFooterLink("টুইংকেল সাহায্য", "WP:TW/DOC#ব্যাচ পুনরুদ্ধার");
    Window.addFooterLink("প্রতিক্রিয়া জানান", "WT:TW");

    var form = new Morebits.quickForm(Twinkle.batchundelete.callback.evaluate);
    form.append({
      type: "checkbox",
      list: [
        {
          label:
            "পুনরুদ্ধার করা পাতাগুলির আলাপ পাতা পূর্বে বিদ্যমান থাকলে, সেগুলিও পুনরুদ্ধার করুন",
          name: "undel_talk",
          value: "undel_talk",
          checked: true,
        },
      ],
    });
    form.append({
      type: "input",
      name: "reason",
      label: "কারণ:",
      size: 60,
    });

    var statusdiv = document.createElement("div");
    statusdiv.style.padding = "15px"; // just so it doesn't look broken
    Window.setContent(statusdiv);
    Morebits.status.init(statusdiv);
    Window.display();

    var query = {
      action: "query",
      generator: "links",
      prop: "info",
      inprop: "protection",
      titles: mw.config.get("wgPageName"),
      gpllimit: Twinkle.getPref("batchMax"),
      format: "json",
    };
    var statelem = new Morebits.status("পাতার তালিকা আনা হচ্ছে");
    var wikipedia_api = new Morebits.wiki.api(
      "লোড করা হচ্ছে...",
      query,
      function (apiobj) {
        var response = apiobj.getResponse();
        var pages = (response.query && response.query.pages) || [];
        pages = pages.filter(function (page) {
          return page.missing;
        });
        var list = [];
        pages.sort(Twinkle.sortByNamespace);
        pages.forEach(function (page) {
          var editProt = page.protection
            .filter(function (pr) {
              return pr.type === "create" && pr.level === "sysop";
            })
            .pop();

          var title = page.title;
          list.push({
            label:
              title +
              (editProt
                ? " (সম্পূর্ণরূপে পাতা সৃষ্টিকরণ সুরক্ষিত" +
                  (editProt.expiry === "infinity"
                    ? ", মেয়াদোত্তীর্ণের তারিখ: অসীম মেয়াদে সুরক্ষিত"
                    : ", মেয়াদোত্তীর্ণের তারিখ: " +
                      new Morebits.date(editProt.expiry).calendar("utc") +
                      " (ইউটিসি)") +
                  ")"
                : ""),
            value: title,
            checked: true,
            style: editProt ? "color:red" : "",
          });
        });
        apiobj.params.form.append({
          type: "header",
          label: "পুনরুদ্ধার করার জন্য পাতাগুলি",
        });
        apiobj.params.form.append({
          type: "button",
          label: "সব নির্বাচন করুন",
          event: function (e) {
            $(Morebits.quickForm.getElements(e.target.form, "pages")).prop(
              "checked",
              true
            );
          },
        });
        apiobj.params.form.append({
          type: "button",
          label: "সবগুলো থেকে নির্বাচন সরান",
          event: function (e) {
            $(Morebits.quickForm.getElements(e.target.form, "pages")).prop(
              "checked",
              false
            );
          },
        });
        apiobj.params.form.append({
          type: "checkbox",
          name: "pages",
          shiftClickSupport: true,
          list: list,
        });
        apiobj.params.form.append({ type: "submit" });

        var result = apiobj.params.form.render();
        apiobj.params.Window.setContent(result);

        Morebits.quickForm
          .getElements(result, "pages")
          .forEach(Twinkle.generateArrowLinks);
      },
      statelem
    );
    wikipedia_api.params = { form: form, Window: Window };
    wikipedia_api.post();
  };

  Twinkle.batchundelete.callback.evaluate = function (event) {
    Morebits.wiki.actionCompleted.notice = "ব্যাচ পুনরুদ্ধারকরণ সম্পন্ন হয়েছে";

    var numProtected = Morebits.quickForm
      .getElements(event.target, "pages")
      .filter(function (element) {
        return (
          element.checked && element.nextElementSibling.style.color === "red"
        );
      }).length;
    if (
      numProtected > 0 &&
      !confirm(
        "আপনি সম্পূর্ণরূপে সুরক্ষিত " +
          numProtected +
          "টি পাতা পুনরুদ্ধার করতে চলেছেন। আপনি কি নিশ্চিত?"
      )
    ) {
      return;
    }

    var input = Morebits.quickForm.getInputData(event.target);

    if (!input.reason) {
      alert("আপনাকে একটি কারণ দেখাতে হবে!");
      return;
    }
    Morebits.simpleWindow.setButtonsEnabled(false);
    Morebits.status.init(event.target);

    if (!input.pages || !input.pages.length) {
      Morebits.status.error(
        "ত্রুটি",
        "পুনরুদ্ধার করার মতো কিছু নেই, বাতিল করা হচ্ছে"
      );
      return;
    }

    var pageUndeleter = new Morebits.batchOperation(
      "পাতাগুলি পুনরুদ্ধার করা হচ্ছে"
    );
    pageUndeleter.setOption("chunkSize", Twinkle.getPref("batchChunks"));
    pageUndeleter.setOption("preserveIndividualStatusLines", true);
    pageUndeleter.setPageList(input.pages);
    pageUndeleter.run(function (pageName) {
      var params = {
        page: pageName,
        undel_talk: input.undel_talk,
        reason: input.reason,
        pageUndeleter: pageUndeleter,
      };

      var wikipedia_page = new Morebits.wiki.page(
        pageName,
        pageName + " পাতাটি পুনরুদ্ধার করা হচ্ছে"
      );
      wikipedia_page.setCallbackParameters(params);
      wikipedia_page.setEditSummary(input.reason);
      wikipedia_page.setChangeTags(Twinkle.changeTags);
      wikipedia_page.suppressProtectWarning();
      wikipedia_page.setMaxRetries(3); // temporary increase from 2 to make batchundelete more likely to succeed [[phab:T222402]] #613
      wikipedia_page.undeletePage(
        Twinkle.batchundelete.callbacks.doExtras,
        pageUndeleter.workerFailure
      );
    });
  };

  Twinkle.batchundelete.callbacks = {
    // this stupid parameter name is a temporary thing until I implement an overhaul
    // of Morebits.wiki.* callback parameters
    doExtras: function (thingWithParameters) {
      var params = thingWithParameters.parent
        ? thingWithParameters.parent.getCallbackParameters()
        : thingWithParameters.getCallbackParameters();
      // the initial batch operation's job is to delete the page, and that has
      // succeeded by now
      params.pageUndeleter.workerSuccess(thingWithParameters);

      var query, wikipedia_api;

      if (params.undel_talk) {
        var talkpagename = new mw.Title(params.page)
          .getTalkPage()
          .getPrefixedText();
        if (talkpagename !== params.page) {
          query = {
            action: "query",
            prop: "deletedrevisions",
            drvprop: "ids",
            drvlimit: 1,
            titles: talkpagename,
            format: "json",
          };
          wikipedia_api = new Morebits.wiki.api(
            "অপসারিত সংস্করণের জন্য আলাপ পাতা পরীক্ষা করা হচ্ছে",
            query,
            Twinkle.batchundelete.callbacks.undeleteTalk
          );
          wikipedia_api.params = params;
          wikipedia_api.params.talkPage = talkpagename;
          wikipedia_api.post();
        }
      }
    },
    undeleteTalk: function (apiobj) {
      var page = apiobj.getResponse().query.pages[0];
      var exists = !page.missing;
      var delrevs = page.deletedrevisions && page.deletedrevisions[0].revid;

      if (exists || !delrevs) {
        // page exists or has no deleted revisions; forget about it
        return;
      }

      var talkpage = new Morebits.wiki.page(
        apiobj.params.talkPage,
        apiobj.params.page + " এর আলাপ পাতা পুনরুদ্ধার করা হচ্ছে"
      );
      talkpage.setEditSummary(
        '"' +
          apiobj.params.page +
          '" এর [[সাহায্য:আলাপ পাতা|আলাপ পাতা]] পুনরুদ্ধার'
      );
      talkpage.setChangeTags(Twinkle.changeTags);
      talkpage.undeletePage();
    },
  };

  Twinkle.addInitCallback(Twinkle.batchundelete, "batchundelete");
})(jQuery);

// </nowiki>

// <nowiki>
/*
অনুবাদ কৃতজ্ঞতা:
**মোঃ মারুফ হাসান
**Yahya
**MdsShakil
*/

  /*
     ****************************************
     *** twinklewarn.js: সতর্কবার্তা মডিউল
     ****************************************
     * Mode of invocation:     Tab ("সতর্কবার্তা")
     * Active on:              Any page with relevant user name (userspace, contribs,
     *                         etc.) (not IP ranges), as well as the rollback success page
     
     *caution কে ‘দ্বিতীয় স্তরের সতর্কতা’ এবং warning কে ‘তৃতীয় স্তরের সতর্কতা’ অনুবাদ করা হয়েছে। --Yahya
    *[[টেমপ্লেট:বাংলায় সম্পাদনা সারাংশ দিন (টুইংকল)]] একক সমস্যার বার্তা অংশে যুক্ত করা হলো --MdsShakil
     */
     
(function ($) {

  Twinkle.warn = function twinklewarn() {
    // Users and IPs but not IP ranges
    if (
      mw.config.exists("wgRelevantUserName") &&
      !Morebits.ip.isRange(mw.config.get("wgRelevantUserName"))
    ) {
      Twinkle.addPortletLink(
        Twinkle.warn.callback,
        "সতর্ক করুন",
        "tw-warn",
        "সতর্ক করুন/ব্যবহারকারীকে অবহিত করুন"
      );
      if (
        Twinkle.getPref("autoMenuAfterRollback") &&
        mw.config.get("wgNamespaceNumber") === 3 &&
        mw.util.getParamValue("vanarticle") &&
        !mw.util.getParamValue("friendlywelcome") &&
        !mw.util.getParamValue("noautowarn")
      ) {
        Twinkle.warn.callback();
      }
    }

    // Modify URL of talk page on rollback success pages, makes use of a
    // custom message box in [[MediaWiki:Rollback-success]]
    if (mw.config.get("wgAction") === "rollback") {
      var $vandalTalkLink = $("#mw-rollback-success")
        .find(".mw-usertoollinks a")
        .first();
      if ($vandalTalkLink.length) {
        $vandalTalkLink.css("font-weight", "bold");
        $vandalTalkLink.wrapInner(
          $("<span/>").attr(
            "title",
            "উপযুক্ত হলে, আপনি এই পৃষ্ঠায় ব্যবহারকারীদের তাদের সম্পাদনা সম্পর্কে সতর্ক করতে টুইঙ্কল ব্যবহার করতে পারেন।"
          )
        );

        // Can't provide vanarticlerevid as only wgCurRevisionId is provided
        var extraParam =
          "vanarticle=" + mw.util.rawurlencode(Morebits.pageNameNorm);
        var href = $vandalTalkLink.attr("href");
        if (href.indexOf("?") === -1) {
          $vandalTalkLink.attr("href", href + "?" + extraParam);
        } else {
          $vandalTalkLink.attr("href", href + "&" + extraParam);
        }
      }
    }
  };

  // Used to close window when switching to ARV in autolevel
  Twinkle.warn.dialog = null;

  Twinkle.warn.callback = function twinklewarnCallback() {
    if (
      mw.config.get("wgRelevantUserName") === mw.config.get("wgUserName") &&
      !confirm(
        "আপনি নিজেকে সতর্ক করতে চলেছেন! আপনি কি নিশ্চিত আপনি এটাই করতে চান?"
      )
    ) {
      return;
    }

    var dialog;
    Twinkle.warn.dialog = new Morebits.simpleWindow(600, 440);
    dialog = Twinkle.warn.dialog;
    dialog.setTitle("সতর্ক করুন/ব্যবহারকারীকে অবহিত করুন");
    dialog.setScriptName("টুইংকল");
    dialog.addFooterLink("একটি সতর্কতা স্তর নির্বাচন করা", "WP:UWUL#Levels");
    dialog.addFooterLink("সতর্কতার পছন্দসমূহ", "WP:TW/PREF#warn");
    dialog.addFooterLink("টুইংকল সাহায্য", "WP:TW/DOC#warn");
    dialog.addFooterLink("প্রতিক্রিয়া জানান", "WT:TW");

    var form = new Morebits.quickForm(Twinkle.warn.callback.evaluate);
    var main_select = form.append({
      type: "field",
      label: "প্রদান করার জন্য সতর্কতার ধরন/বিজ্ঞপ্তি বেছে নিন",
      tooltip:
        "প্রথমে একটি প্রধান সতর্কতা গ্রুপ নির্বাচন করুন, তারপরে প্রদান করার জন্য একটি নির্দিষ্ট সতর্কতা বাছাই করুন।",
    });

    var main_group = main_select.append({
      type: "select",
      name: "main_group",
      tooltip:
        "আপনি আপনার টুইঙ্কল পছন্দগুলিতে ডিফল্ট নির্বাচনটি কাস্টমাইজ করতে পারেন",
      event: Twinkle.warn.callback.change_category,
    });

    var defaultGroup = parseInt(Twinkle.getPref("defaultWarningGroup"), 10);
    main_group.append({
      type: "option",
      label: "স্বয়ংক্রিয় স্তর নির্বাচন (১-৪)",
      value: "autolevel",
      selected: defaultGroup === 11,
    });
    main_group.append({
      type: "option",
      label: "১: সাধারণ বিজ্ঞপ্তি",
      value: "level1",
      selected: defaultGroup === 1,
    });
    main_group.append({
      type: "option",
      label: "২: দ্বিতীয় স্তরের সতর্কবার্তা",
      value: "level2",
      selected: defaultGroup === 2,
    });
    main_group.append({
      type: "option",
      label: "৩: তৃতীয় স্তরের সতর্কবার্তা",
      value: "level3",
      selected: defaultGroup === 3,
    });
    main_group.append({
      type: "option",
      label: "৪: সর্বশেষ সতর্কবার্তা",
      value: "level4",
      selected: defaultGroup === 4,
    });
    main_group.append({
      type: "option",
      label: "4im: একমাত্র সতর্কবার্তা",
      value: "level4im",
      selected: defaultGroup === 5,
    });
    if (Twinkle.getPref("combinedSingletMenus")) {
      main_group.append({
        type: "option",
        label: "একক সমস্যার বার্তা",
        value: "singlecombined",
        selected: defaultGroup === 6 || defaultGroup === 7,
      });
    } else {
      main_group.append({
        type: "option",
        label: "একক সমস্যার বার্তা",
        value: "singlenotice",
        selected: defaultGroup === 6,
      });
      main_group.append({
        type: "option",
        label: "একক সমস্যার সতর্কবার্তা",
        value: "singlewarn",
        selected: defaultGroup === 7,
      });
    }
    if (Twinkle.getPref("customWarningList").length) {
      main_group.append({
        type: "option",
        label: "স্বনির্ধারিত সতর্কবার্তা",
        value: "custom",
        selected: defaultGroup === 9,
      });
    }
    main_group.append({
      type: "option",
      label: "সকল সতর্কবার্তা টেমপ্লেট",
      value: "kitchensink",
      selected: defaultGroup === 10,
    });

    main_select.append({
      type: "select",
      name: "sub_group",
      event: Twinkle.warn.callback.change_subcategory,
    }); // Will be empty to begin with.

    form.append({
      type: "input",
      name: "article",
      label: "সংযুক্ত পাতা",
      value: mw.util.getParamValue("vanarticle") || "",
      tooltip:
        "একটি পাতা বিজ্ঞপ্তির সাথে সংযুক্ত করা যেতে পারে, কারণ সম্ভবত আপনি উল্লিখিত পাতায় সম্পাদনা পুনর্বহাল করেছিলেন যে কারণে এই বিজ্ঞপ্তিটি পাঠাচ্ছেন।  কোন পৃষ্ঠা সংযুক্ত না করতে এটি খালি রাখুন।",
    });

    form.append({
      type: "div",
      label: "",
      style: "color: red",
      id: "twinkle-warn-warning-messages",
    });

    var more = form.append({
      type: "field",
      name: "reasonGroup",
      label: "সতর্কীকরণ তথ্য",
    });
    more.append({
      type: "textarea",
      label: "ঐচ্ছিক বার্তা:",
      name: "reason",
      tooltip:
        "সম্ভবত একটি কারণ, অথবা আরো বিস্তারিত বিজ্ঞপ্তি সংযুক্ত করা আবশ্যক",
    });

    var previewlink = document.createElement("a");
    $(previewlink).click(function () {
      Twinkle.warn.callbacks.preview(result); // |result| is defined below
    });
    previewlink.style.cursor = "pointer";
    previewlink.textContent = "প্রাকদর্শন";
    more.append({ type: "div", id: "warningpreview", label: [previewlink] });
    more.append({
      type: "div",
      id: "twinklewarn-previewbox",
      style: "display: none",
    });

    more.append({ type: "submit", label: "জমা দিন" });

    var result = form.render();
    dialog.setContent(result);
    dialog.display();
    result.main_group.root = result;
    result.previewer = new Morebits.wiki.preview(
      $(result).find("div#twinklewarn-previewbox").last()[0]
    );

    // Potential notices for staleness and missed reverts
    var vanrevid = mw.util.getParamValue("vanarticlerevid");
    if (vanrevid) {
      var message = "";
      var query = {};

      // If you tried reverting, check if *you* actually reverted
      if (
        !mw.util.getParamValue("noautowarn") &&
        mw.util.getParamValue("vanarticle")
      ) {
        // Via fluff link
        query = {
          action: "query",
          titles: mw.util.getParamValue("vanarticle"),
          prop: "revisions",
          rvstartid: vanrevid,
          rvlimit: 2,
          rvdir: "newer",
          rvprop: "user",
          format: "json",
        };

        new Morebits.wiki.api(
          "আপনি পাতাটি সফলভাবে সম্পাদনা পুনর্বহাল করেছেন কিনা তা পরীক্ষা করা হচ্ছে",
          query,
          function (apiobj) {
            var rev = apiobj.getResponse().query.pages[0].revisions;
            var revertUser = rev && rev[1].user;
            if (revertUser && revertUser !== mw.config.get("wgUserName")) {
              message +=
                " অন্য কেউ পাতাটিতে পুনর্বহাল করেছেন এবং ইতিমধ্যেই ব্যবহারকারীকে সতর্ক করেছে।";
              $("#twinkle-warn-warning-messages").text("বিজ্ঞপ্তি:" + message);
            }
          }
        ).post();
      }

      // Confirm edit wasn't too old for a warning
      var checkStale = function (vantimestamp) {
        var revDate = new Morebits.date(vantimestamp);
        if (vantimestamp && revDate.isValid()) {
          if (revDate.add(24, "hours").isBefore(new Date())) {
            message +=
              " এই সম্পাদনাটি ২৪ ঘন্টারও বেশি আগে করা হয়েছিল তাই একটি সতর্কতা পুরনো হতে পারে।";
            $("#twinkle-warn-warning-messages").text("বিজ্ঞপ্তি:" + message);
          }
        }
      };

      var vantimestamp = mw.util.getParamValue("vantimestamp");
      // Provided from a fluff module-based revert, no API lookup necessary
      if (vantimestamp) {
        checkStale(vantimestamp);
      } else {
        query = {
          action: "query",
          prop: "revisions",
          rvprop: "timestamp",
          revids: vanrevid,
          format: "json",
        };
        new Morebits.wiki.api(
          "সংস্করণ টাইমস্ট্যাম্প আনা হচ্ছে",
          query,
          function (apiobj) {
            var rev = apiobj.getResponse().query.pages[0].revisions;
            vantimestamp = rev && rev[0].timestamp;
            checkStale(vantimestamp);
          }
        ).post();
      }
    }

    // We must init the first choice (General Note);
    var evt = document.createEvent("Event");
    evt.initEvent("change", true, true);
    result.main_group.dispatchEvent(evt);
  };

  // This is all the messages that might be dispatched by the code
  // Each of the individual templates require the following information:
  //   label (required): A short description displayed in the dialog
  //   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with "."
  //   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
  Twinkle.warn.messages = {
    levels: {
      "Common warnings": {
        "uw-vandalism": {
          level1: {
            label: "ধ্বংসপ্রবণতা",
            summary: "সাধারণ বিজ্ঞপ্তি: অগঠনমূলক সম্পাদনা",
          },
          level2: {
            label: "ধ্বংসপ্রবণতা",
            summary: "দ্বিতীয় স্তরের সতর্কতা: অগঠনমূলক সম্পাদনা",
          },
          level3: {
            label: "ধ্বংসপ্রবণতা",
            summary: "তৃতীয় স্তরের সতর্কতা: ধ্বংসপ্রবণতা",
          },
          level4: {
            label: "ধ্বংসপ্রবণতা",
            summary: "সর্বশেষ সতর্কতা: ধ্বংসপ্রবণতা",
          },
          level4im: {
            label: "ধ্বংসপ্রবণতা",
            summary: "একমাত্র সতর্কতা: ধ্বংসপ্রবণতা",
          },
        },
        "uw-disruptive": {
          level1: {
            label: "অগঠনমূলক সম্পাদনা",
            summary: "সাধারণ বিজ্ঞপ্তি: অগঠমূলক সম্পাদনা",
          },
          level2: {
            label: "অগঠনমূলক সম্পাদনা",
            summary: "দ্বিতীয় স্তরের সতর্কতা: অগঠমূলক সম্পাদনা",
          },
          level3: {
            label: "অগঠনমূলক সম্পাদনা",
            summary: "তৃতীয় স্তরের সতর্কতা: অগঠনমূলক সম্পাদনা",
          },
        },
        "uw-test": {
          level1: {
            label: "পরীক্ষামূলক সম্পাদনা",
            summary: "সাধারণ বিজ্ঞপ্তি: পরীক্ষামূলক সম্পাদনা",
          },
          level2: {
            label: "পরীক্ষামূলক সম্পাদনা",
            summary: "দ্বিতীয় স্তরের সতর্কতা: পরীক্ষামূলক সম্পাদনা",
          },
          level3: {
            label: "পরীক্ষামূলক সম্পাদনা",
            summary: "তৃতীয় স্তরের সতর্কতা: পরীক্ষামূলক সম্পাদনা",
          },
        },
        "uw-delete": {
          level1: {
            label: "পাতার বিষয়বস্তু অপসারণ বা খালি করা",
            summary: "সাধারণ বিজ্ঞপ্তি: পাতার বিষয়বস্তু অপসারণ বা খালি করা",
          },
          level2: {
            label: "পাতার বিষয়বস্তু অপসারণ বা খালি করা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: পাতার বিষয়বস্তু অপসারণ বা খালি করা",
          },
          level3: {
            label: "পাতার বিষয়বস্তু অপসারণ বা খালি করা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: পাতার বিষয়বস্তু অপসারণ বা খালি করা",
          },
          level4: {
            label: "পাতার বিষয়বস্তু অপসারণ বা খালি করা",
            summary: "সর্বশেষ সতর্কতা: পাতার বিষয়বস্তু অপসারণ বা খালি করা",
          },
          level4im: {
            label: "পাতার বিষয়বস্তু অপসারণ বা খালি করা",
            summary: "একমাত্র সতর্কতা: পাতার বিষয়বস্তু অপসারণ বা খালি করা",
          },
        },
        "uw-generic": {
          level4: {
            label:
              "জেনেরিক সতর্কতা (৪র্থ স্তরের অনুপস্থিত টেমপ্লেট সিরিজের জন্য)",
            summary: "সর্বশেষ সতর্কতা বিজ্ঞপ্তি",
          },
        },
      },
      "Behavior in articles": {
        "uw-biog": {
          level1: {
            label:
              "জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্রবিহীন বিতর্কিত তথ্য যোগ করা",
            summary:
              "সাধারণ বিজ্ঞপ্তি: জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্রবিহীন বিতর্কিত তথ্য যোগ করা",
          },
          level2: {
            label:
              "জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্রবিহীন বিতর্কিত তথ্য যোগ করা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্রবিহীন বিতর্কিত তথ্য যোগ করা",
          },
          level3: {
            label:
              "জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্রবিহীন বিতর্কিত/মানহানীকর তথ্য যোগ করা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্রবিহীন বিতর্কিত তথ্য যোগ করা",
          },
          level4: {
            label:
              "জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্র বিহীন মানহানিকর তথ্য যোগ করা",
            summary:
              "সর্বশেষ সতর্কতা: জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্রবিহীন বিতর্কিত তথ্য যোগ করা",
          },
          level4im: {
            label:
              "জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্র বিহীন মানহানিকর তথ্য যোগ করা",
            summary:
              "একমাত্র সতর্কতা: জীবিত ব্যক্তিদের সম্পর্কে তথ্যসূত্রবিহীন বিতর্কিত তথ্য যোগ করা",
          },
        },
        "uw-defamatory": {
          level1: {
            label: "মানহানিকর বিষয়বস্তুর সংযোজন",
            summary: "সাধারণ বিজ্ঞপ্তি: মানহানিকর বিষয়বস্তুর সংযোজন",
          },
          level2: {
            label: "মানহানিকর বিষয়বস্তুর সংযোজন",
            summary: "দ্বিতীয় স্তরের সতর্কতা: মানহানিকর বিষয়বস্তুর সংযোজন",
          },
          level3: {
            label: "মানহানিকর বিষয়বস্তুর সংযোজন",
            summary: "তৃতীয় স্তরের সতর্কতা: মানহানিকর বিষয়বস্তুর সংযোজন",
          },
          level4: {
            label: "মানহানিকর বিষয়বস্তুর সংযোজন",
            summary: "সর্বশেষ সতর্কতা: মানহানিকর বিষয়বস্তুর সংযোজন",
          },
          level4im: {
            label: "মানহানিকর বিষয়বস্তুর সংযোজন",
            summary: "একমাত্র সতর্কতা: মানহানিকর বিষয়বস্তুর সংযোজন",
          },
        },
        "uw-error": {
          level1: {
            label: "ইচ্ছাকৃত বাস্তবভিত্তিক ত্রুটি যোগ করা",
            summary: "সাধারণ বিজ্ঞপ্তি: ইচ্ছাকৃত বাস্তবভিত্তিক ত্রুটি যোগ",
          },
          level2: {
            label: "ইচ্ছাকৃত বাস্তবভিত্তিক ত্রুটি যোগ করা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: ইচ্ছাকৃত বাস্তবভিত্তিক ত্রুটি যোগ",
          },
          level3: {
            label: "ইচ্ছাকৃত বাস্তবভিত্তিক ত্রুটি যোগ করা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: ইচ্ছাকৃত বাস্তবভিত্তিক ত্রুটি যোগ করা",
          },
          level4: {
            label: "ইচ্ছাকৃত বাস্তবভিত্তিক ত্রুটি যোগ করা",
            summary: "সর্বশেষ সতর্কতা: ইচ্ছাকৃত বাস্তবভিত্তিক ত্রুটি যোগ করা",
          },
        },
        "uw-genre": {
          level1: {
            label: "ঐকমত্য বা তথ্যসূত্র ছাড়া ঘরানার ঘন ঘন বা গণ পরিবর্তন",
            summary:
              "সাধারণ বিজ্ঞপ্তি: ঐকমত্য বা তথ্যসূত্র ছাড়া ঘরানার ঘন ঘন বা গণ পরিবর্তন",
          },
          level2: {
            label: "ঐকমত্য বা তথ্যসূত্র ছাড়া ঘরানার ঘন ঘন বা গণ পরিবর্তন",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: ঐকমত্য বা তথ্যসূত্র ছাড়া ঘরানার ঘন ঘন বা গণ পরিবর্তন",
          },
          level3: {
            label: "ঐকমত্য বা তথ্যসূত্র ছাড়া ঘরানার ঘন ঘন বা গণ পরিবর্তন",
            summary:
              "তৃতীয় স্তরের সতর্কতা: ঐকমত্য বা তথ্যসূত্র ছাড়া ঘরানার ঘন ঘন বা গণ পরিবর্তন",
          },
          level4: {
            label: "ঐকমত্য বা তথ্যসূত্র ছাড়া ঘরানার ঘন ঘন বা গণ পরিবর্তন",
            summary:
              "সর্বশেষ সতর্কতা: ঐকমত্য বা তথ্যসূত্র ছাড়া ঘরানার ঘন ঘন বা গণ পরিবর্তন",
          },
        },
        "uw-image": {
          level1: {
            label: "নিবন্ধে চিত্র-সংক্রান্ত ধ্বংসাত্মক সম্পাদনা",
            summary:
              "সাধারণ বিজ্ঞপ্তি: নিবন্ধে চিত্র-সংক্রান্ত ধ্বংসাত্মক সম্পাদনা",
          },
          level2: {
            label: "নিবন্ধে চিত্র-সংক্রান্ত ধ্বংসাত্মক সম্পাদনা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: নিবন্ধে চিত্র-সংক্রান্ত ধ্বংসাত্মক সম্পাদনা",
          },
          level3: {
            label: "নিবন্ধে চিত্র-সংক্রান্ত ধ্বংসাত্মক সম্পাদনা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: নিবন্ধে চিত্র-সংক্রান্ত ধ্বংসাত্মক সম্পাদনা",
          },
          level4: {
            label: "নিবন্ধে চিত্র-সংক্রান্ত ধ্বংসাত্মক সম্পাদনা",
            summary:
              "সর্বশেষ সতর্কতা: নিবন্ধে চিত্র-সংক্রান্ত ধ্বংসাত্মক সম্পাদনা",
          },
          level4im: {
            label: "চিত্র-সংক্রান্ত ধ্বংসপ্রবণতা",
            summary: "একমাত্র সতর্কতা: চিত্র-সংক্রান্ত ধ্বংসাত্মক সম্পাদনা",
          },
        },
        "uw-joke": {
          level1: {
            label: "নিবন্ধে অনুপযুক্ত হাস্যরস ব্যবহার করা",
            summary: "সাধারণ বিজ্ঞপ্তি: নিবন্ধে অনুপযুক্ত হাস্যরস ব্যবহার করা",
          },
          level2: {
            label: "নিবন্ধে অনুপযুক্ত হাস্যরস ব্যবহার করা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: নিবন্ধে অনুপযুক্ত হাস্যরস ব্যবহার করা",
          },
          level3: {
            label: "নিবন্ধে অনুপযুক্ত হাস্যরস ব্যবহার করা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: নিবন্ধে অনুপযুক্ত হাস্যরস ব্যবহার করা",
          },
          level4: {
            label: "নিবন্ধে অনুপযুক্ত হাস্যরস ব্যবহার করা",
            summary: "সর্বশেষ সতর্কতা: নিবন্ধে অনুপযুক্ত হাস্যরস ব্যবহার করা",
          },
          level4im: {
            label: "অনুপযুক্ত হাস্যরস ব্যবহার",
            summary: "একমাত্র সতর্কতা: অনুপযুক্ত হাস্যরস ব্যবহার",
          },
        },
        "uw-nor": {
          level1: {
            label: "উৎসের অপ্রকাশিত বিশ্লেষণ সহ ব্যক্তিগত গবেষণা যোগ করা",
            summary:
              "সাধারণ বিজ্ঞপ্তি: উৎসের অপ্রকাশিত বিশ্লেষণ সহ ব্যক্তিগত গবেষণা যোগ করা",
          },
          level2: {
            label: "উৎসের অপ্রকাশিত বিশ্লেষণ সহ ব্যক্তিগত গবেষণা যোগ করা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: উৎসের অপ্রকাশিত বিশ্লেষণ সহ ব্যক্তিগত গবেষণা যোগ করা",
          },
          level3: {
            label: "উৎসের অপ্রকাশিত বিশ্লেষণ সহ ব্যক্তিগত গবেষণা যোগ করা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: উৎসের অপ্রকাশিত বিশ্লেষণ সহ ব্যক্তিগত গবেষণা যোগ করা",
          },
          level4: {
            label: "উৎসের অপ্রকাশিত বিশ্লেষণ সহ ব্যক্তিগত গবেষণা যোগ করা",
            summary:
              "সর্বশেষ সতর্কতা: উৎসের অপ্রকাশিত বিশ্লেষণ সহ ব্যক্তিগত গবেষণা যোগ করা",
          },
        },
        "uw-notcensored": {
          level1: {
            label: "উপাদান সেন্সরশিপ",
            summary: "সাধারণ বিজ্ঞপ্তি: উপাদান সেন্সরশিপ",
          },
          level2: {
            label: "উপাদান সেন্সরশিপ",
            summary: "দ্বিতীয় স্তরের সতর্কতা: উপাদান সেন্সরশিপ",
          },
          level3: {
            label: "উপাদান সেন্সরশিপ",
            summary: "তৃতীয় স্তরের সতর্কতা: উপাদান সেন্সরশিপ",
          },
        },
        "uw-own": {
          level1: {
            label: "নিবন্ধের মালিকানা",
            summary: "সাধারণ বিজ্ঞপ্তি: নিবন্ধের মালিকানা",
          },
          level2: {
            label: "নিবন্ধের মালিকানা",
            summary: "দ্বিতীয় স্তরের সতর্কতা: নিবন্ধের মালিকানা",
          },
          level3: {
            label: "নিবন্ধের মালিকানা",
            summary: "তৃতীয় স্তরের সতর্কতা: নিবন্ধের মালিকানা",
          },
          level4: {
            label: "নিবন্ধের মালিকানা",
            summary: "সর্বশেষ সতর্কতা: নিবন্ধের মালিকানা",
          },
          level4im: {
            label: "নিবন্ধের মালিকানা",
            summary: "একমাত্র সতর্কতা: নিবন্ধের মালিকানা",
          },
        },
        "uw-subtle": {
          level1: {
            label: "সূক্ষ্ম ধ্বংপ্রবণতা",
            summary: "সাধারণ বিজ্ঞপ্তি: সম্ভবত অগঠনমূলক সম্পাদনা",
          },
          level2: {
            label: "সূক্ষ্ম ধ্বংপ্রবণতা",
            summary: "দ্বিতীয় স্তরের সতর্কতা: সম্ভাব্য অগঠনমূলক সম্পাদনা",
          },
          level3: {
            label: "সূক্ষ্ম ধ্বংপ্রবণতা",
            summary: "তৃতীয় স্তরের সতর্কতা: সূক্ষ্ম ধ্বংপ্রবণতা",
          },
          level4: {
            label: "সূক্ষ্ম ধ্বংপ্রবণতা",
            summary: "সর্বশেষ সতর্কতা: সূক্ষ্ম ধ্বংপ্রবণতা",
          },
        },
        "uw-tdel": {
          level1: {
            label: "রক্ষণাবেক্ষণ টেমপ্লেট অপসারণ",
            summary: "সাধারণ বিজ্ঞপ্তি: রক্ষণাবেক্ষণ টেমপ্লেট অপসারণ",
          },
          level2: {
            label: "রক্ষণাবেক্ষণ টেমপ্লেট অপসারণ",
            summary: "দ্বিতীয় স্তরের সতর্কতা: রক্ষণাবেক্ষণ টেমপ্লেট অপসারণ",
          },
          level3: {
            label: "রক্ষণাবেক্ষণ টেমপ্লেট অপসারণ",
            summary: "তৃতীয় স্তরের সতর্কতা: রক্ষণাবেক্ষণ টেমপ্লেট অপসারণ",
          },
          level4: {
            label: "রক্ষণাবেক্ষণ টেমপ্লেট অপসারণ",
            summary: "সর্বশেষ সতর্কতা: রক্ষণাবেক্ষণ টেমপ্লেট অপসারণ",
          },
        },
        "uw-unsourced": {
          level1: {
            label: "তথ্যসূত্র বিহীন বা অনুপযুক্ত উদ্ধৃতি সহ উপাদান যোগ করা",
            summary:
              "সাধারণ বিজ্ঞপ্তি: তথ্যসূত্র বিহীন বা অনুপযুক্ত উদ্ধৃতি সহ উপাদান যোগ করা",
          },
          level2: {
            label: "তথ্যসূত্র বিহীন বা অনুপযুক্ত উদ্ধৃতি সহ উপাদান যোগ করা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: তথ্যসূত্র বিহীন বা অনুপযুক্ত উদ্ধৃতি সহ উপাদান যোগ করা",
          },
          level3: {
            label: "তথ্যসূত্র বিহীন বা অনুপযুক্ত উদ্ধৃতি সহ উপাদান যোগ করা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: তথ্যসূত্র বিহীন বা অনুপযুক্ত উদ্ধৃতি সহ উপাদান যোগ করা",
          },
          level4: {
            label: "তথ্যসূত্র বিহীন বা অনুপযুক্ত উদ্ধৃতি সহ উপাদান যোগ করা",
            summary:
              "সর্বশেষ সতর্কতা: তথ্যসূত্র বিহীন বা অনুপযুক্ত উদ্ধৃতি সহ উপাদান যোগ করা",
          },
        },
      },
      "প্রচারণা ও স্প্যাম": {
        "uw-advert": {
          level1: {
            label: "বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
            summary:
              "সাধারণ বিজ্ঞপ্তি: বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
          },
          level2: {
            label: "বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
          },
          level3: {
            label: "বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
          },
          level4: {
            label: "বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
            summary:
              "সর্বশেষ সতর্কতা: বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
          },
          level4im: {
            label: "বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
            summary:
              "একমাত্র সতর্কতা: বিজ্ঞাপন বা প্রচারনার উদ্দেশ্যে উইকিপিডিয়া ব্যবহার করা",
          },
        },
        "uw-npov": {
          level1: {
            label: "নিরপেক্ষ দৃষ্টিভঙ্গি মেনে চলে না",
            summary: "সাধারণ বিজ্ঞপ্তি: নিরপেক্ষ দৃষ্টিভঙ্গি মেনে চলে না",
          },
          level2: {
            label: "নিরপেক্ষ দৃষ্টিভঙ্গি মেনে চলে না",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: নিরপেক্ষ দৃষ্টিভঙ্গি মেনে চলে না",
          },
          level3: {
            label: "নিরপেক্ষ দৃষ্টিভঙ্গি মেনে চলে না",
            summary: "তৃতীয় স্তরের সতর্কতা: নিরপেক্ষ দৃষ্টিভঙ্গি মেনে চলে না",
          },
          level4: {
            label: "নিরপেক্ষ দৃষ্টিভঙ্গি মেনে চলে না",
            summary: "সর্বশেষ সতর্কতা: নিরপেক্ষ দৃষ্টিভঙ্গি মেনে চলে না",
          },
        },
        "uw-paid": {
          level1: {
            label:
              "উইকিমিডিয়া ব্যবহারের শর্তাবলীর অধীনে পূর্ব ঘোষণা ছাড়াই অর্থের বিনিময়ে সম্পাদনা",
            summary:
              "সাধারণ বিজ্ঞপ্তি: উইকিমিডিয়া ব্যবহারের শর্তাবলীর অধীনে পূর্ব ঘোষণা ছাড়াই অর্থের বিনিময়ে সম্পাদনা",
          },
          level2: {
            label:
              "উইকিমিডিয়া ব্যবহারের শর্তাবলীর অধীনে পূর্ব ঘোষণা ছাড়াই অর্থের বিনিময়ে সম্পাদনা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: উইকিমিডিয়া ব্যবহারের শর্তাবলীর অধীনে পূর্ব ঘোষণা ছাড়াই অর্থের বিনিময়ে সম্পাদনা",
          },
          level3: {
            label:
              "উইকিমিডিয়া ব্যবহারের শর্তাবলীর অধীনে পূর্ব ঘোষণা ছাড়াই অর্থের বিনিময়ে সম্পাদনা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: উইকিমিডিয়া ব্যবহারের শর্তাবলীর অধীনে পূর্ব ঘোষণা ছাড়াই অর্থের বিনিময়ে সম্পাদনা",
          },
          level4: {
            label:
              "উইকিমিডিয়া ব্যবহারের শর্তাবলীর অধীনে পূর্ব ঘোষণা ছাড়াই অর্থের বিনিময়ে সম্পাদনা",
            summary:
              "সর্বশেষ সতর্কতা: উইকিমিডিয়া ব্যবহারের শর্তাবলীর অধীনে পূর্ব ঘোষণা ছাড়াই অর্থের বিনিময়ে সম্পাদনা",
          },
        },
        "uw-spam": {
          level1: {
            label: "অনুপযুক্ত বহিঃসংযোগ যোগ করা",
            summary: "সাধারণ বিজ্ঞপ্তি: অনুপযুক্ত বহিঃসংযোগ যোগ করা",
          },
          level2: {
            label: "স্প্যাম লিংক সংযোজন",
            summary: "দ্বিতীয় স্তরের সতর্কতা: স্প্যাম লিংক সংযোজন",
          },
          level3: {
            label: "স্প্যাম লিংক সংযোজন",
            summary: "তৃতীয় স্তরের সতর্কতা: স্প্যাম লিংক সংযোজন",
          },
          level4: {
            label: "স্প্যাম লিংক সংযোজন",
            summary: "সর্বশেষ সতর্কতা: স্প্যাম লিংক সংযোজন",
          },
          level4im: {
            label: "স্প্যাম লিংক সংযোজন",
            summary: "একমাত্র সতর্কতা: স্প্যাম লিংক সংযোজন",
          },
        },
      },
      "অন্য ব্যবহারকারীর প্রতি আচরণ": {
        "uw-agf": {
          level1: {
            label: "অন্য ব্যবহারকারীর উপর আস্থা না রাখা",
            summary: "সাধারণ বিজ্ঞপ্তি: অন্য ব্যবহারকারীর উপর আস্থা না রাখা",
          },
          level2: {
            label: "অন্য ব্যবহারকারীর উপর আস্থা না রাখা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: অন্য ব্যবহারকারীর উপর আস্থা না রাখা",
          },
          level3: {
            label: "অন্য ব্যবহারকারীর উপর আস্থা না রাখা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: অন্য ব্যবহারকারীর উপর আস্থা না রাখা",
          },
        },
        "uw-harass": {
          level1: {
            label: "অন্য ব্যবহারকারীদের হয়রানি",
            summary: "সাধারণ বিজ্ঞপ্তি: অন্য ব্যবহারকারীদের হয়রানি",
          },
          level2: {
            label: "অন্য ব্যবহারকারীদের হয়রানি",
            summary: "দ্বিতীয় স্তরের সতর্কতা: অন্য ব্যবহারকারীদের হয়রানি",
          },
          level3: {
            label: "অন্য ব্যবহারকারীদের হয়রানি",
            summary: "তৃতীয় স্তরের সতর্কতা: অন্য ব্যবহারকারীদের হয়রানি",
          },
          level4: {
            label: "অন্য ব্যবহারকারীদের হয়রানি",
            summary: "সর্বশেষ সতর্কতা: অন্য ব্যবহারকারীদের হয়রানি",
          },
          level4im: {
            label: "অন্য ব্যবহারকারীদের হয়রানি",
            summary: "একমাত্র সতর্কতা: অন্য ব্যবহারকারীদের হয়রানি",
          },
        },
        "uw-npa": {
          level1: {
            label: "একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
            summary:
              "সাধারণ বিজ্ঞপ্তি: একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
          },
          level2: {
            label: "একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
          },
          level3: {
            label: "একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
            summary:
              "তৃতীয় স্তরের সতর্কতা: একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
          },
          level4: {
            label: "একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
            summary:
              "সর্বশেষ সতর্কতা: একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
          },
          level4im: {
            label: "একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
            summary:
              "একমাত্র সতর্কতা: একজন নির্দিষ্ট সম্পাদককে লক্ষ্য করে ব্যক্তিগত আক্রমণ",
          },
        },
        "uw-tempabuse": {
          level1: {
            label: "সতর্কতা ও বাধা দান টেমপ্লেটের অনুপযুক্ত ব্যবহার",
            summary:
              "সাধারণ বিজ্ঞপ্তি: সতর্কতা ও বাধা দান টেমপ্লেটের অনুপযুক্ত ব্যবহার",
          },
          level2: {
            label: "সতর্কতা ও বাধা দান টেমপ্লেটের অনুপযুক্ত ব্যবহার",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: সতর্কতা ও বাধা দান টেমপ্লেটের অনুপযুক্ত ব্যবহার",
          },
        },
      },
      "অপসারণ ট্যাগ অপসারণ": {
        "uw-afd": {
          level1: {
            label: "{{নিবন্ধ অপসারণের প্রস্তাবনা}} টেমপ্লেট অপসারণ",
            summary:
              "সাধারণ বিজ্ঞপ্তি: {{নিবন্ধ অপসারণের প্রস্তাবনা}} টেমপ্লেট অপসারণ",
          },
          level2: {
            label: "{{নিবন্ধ অপসারণের প্রস্তাবনা}} টেমপ্লেট অপসারণ",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: {{নিবন্ধ অপসারণের প্রস্তাবনা}} টেমপ্লেট অপসারণ",
          },
          level3: {
            label: "{{নিবন্ধ অপসারণের প্রস্তাবনা}} টেমপ্লেট অপসারণ",
            summary:
              "তৃতীয় স্তরের সতর্কতা: {{নিবন্ধ অপসারণের প্রস্তাবনা}} টেমপ্লেট অপসারণ",
          },
          level4: {
            label: "{{নিবন্ধ অপসারণের প্রস্তাবনা}} টেমপ্লেট অপসারণ",
            summary:
              "সর্বশেষ সতর্কতা: {{নিবন্ধ অপসারণের প্রস্তাবনা}} টেমপ্লেট অপসারণ",
          },
        },
        "uw-blpprod": {
          level1: {
            label: "{{Prod blp}} টেমপ্লেট অপসারণ",
            summary: "সাধারণ বিজ্ঞপ্তি: {{Prod blp}} টেমপ্লেট অপসারণ",
          },
          level2: {
            label: "{{Prod blp}} টেমপ্লেট অপসারণ",
            summary: "দ্বিতীয় স্তরের সতর্কতা: {{Prod blp}} টেমপ্লেট অপসারণ",
          },
          level3: {
            label: "{{Prod blp}} টেমপ্লেট অপসারণ",
            summary: "তৃতীয় স্তরের সতর্কতা: {{Prod blp}} টেমপ্লেট অপসারণ",
          },
          level4: {
            label: "{{Prod blp}} টেমপ্লেট অপসারণ",
            summary: "সর্বশেষ সতর্কতা: {{Prod blp}} টেমপ্লেট অপসারণ",
          },
        },
        "uw-idt": {
          level1: {
            label: "ফাইল অপসারন ট্যাগ অপসারণ",
            summary: "সাধারণ বিজ্ঞপ্তি: ফাইল অপসারন ট্যাগ অপসারণ",
          },
          level2: {
            label: "ফাইল অপসারন ট্যাগ অপসারণ",
            summary: "দ্বিতীয় স্তরের সতর্কতা: ফাইল অপসারন ট্যাগ অপসারণ",
          },
          level3: {
            label: "ফাইল অপসারন ট্যাগ অপসারণ",
            summary: "তৃতীয় স্তরের সতর্কতা: ফাইল অপসারন ট্যাগ অপসারণ",
          },
          level4: {
            label: "ফাইল অপসারন ট্যাগ অপসারণ",
            summary: "সর্বশেষ সতর্কতা: ফাইল অপসারন ট্যাগ অপসারণ",
          },
        },
			'uw-tfd': {
				level1: {
					label: 'টেমপ্লেট অপসারন ট্যাগ অপসারণ',
					summary: 'সাধারণ বিজ্ঞপ্তি: টেমপ্লেট অপসারন ট্যাগ অপসারণ'
				},
				level2: {
					label: 'টেমপ্লেট অপসারন ট্যাগ অপসারণ',
					summary: 'দ্বিতীয় স্তরের সতর্কতা: টেমপ্লেট অপসারন ট্যাগ অপসারণ'
				},
				level3: {
					label: 'টেমপ্লেট অপসারন ট্যাগ অপসারণ',
					summary: 'তৃতীয় স্তরের সতর্কতা: টেমপ্লেট অপসারন ট্যাগ অপসারণ'
				},
				level4: {
					label: 'টেমপ্লেট অপসারন ট্যাগ অপসারণ',
					summary: 'সর্বশেষ সতর্কতা: টেমপ্লেট অপসারন ট্যাগ অপসারণ'
          },
        },
        "uw-speedy": {
          level1: {
            label: "দ্রুত অপসারণ ট্যাগ অপসারণ",
            summary: "সাধারণ বিজ্ঞপ্তি: দ্রুত অপসারণ ট্যাগ অপসারণ",
          },
          level2: {
            label: "দ্রুত অপসারণ ট্যাগ অপসারণ",
            summary: "দ্বিতীয় স্তরের সতর্কতা: দ্রুত অপসারণ ট্যাগ অপসারণ",
          },
          level3: {
            label: "দ্রুত অপসারণ ট্যাগ অপসারণ",
            summary: "তৃতীয় স্তরের সতর্কতা: দ্রুত অপসারণ ট্যাগ অপসারণ",
          },
          level4: {
            label: "দ্রুত অপসারণ ট্যাগ অপসারণ",
            summary: "সর্বশেষ সতর্কতা: দ্রুত অপসারণ ট্যাগ অপসারণ",
          },
        },
      },
      Other: {
        "uw-attempt": {
          level1: {
            label: "সম্পাদনা ছাঁকনি ট্রিগার করা",
            summary: "সাধারণ বিজ্ঞপ্তি: সম্পাদনা ছাঁকনি ট্রিগার করা",
          },
          level2: {
            label: "সম্পাদনা ছাঁকনি ট্রিগার করা",
            summary: "দ্বিতীয় স্তরের সতর্কতা: সম্পাদনা ছাঁকনি ট্রিগার করা",
          },
          level3: {
            label: "সম্পাদনা ছাঁকনি ট্রিগার করা",
            summary: "তৃতীয় স্তরের সতর্কতা: সম্পাদনা ছাঁকনি ট্রিগার করা",
          },
          level4: {
            label: "সম্পাদনা ছাঁকনি ট্রিগার করা",
            summary: "সর্বশেষ সতর্কতা: সম্পাদনা ছাঁকনি ট্রিগার করা",
          },
          level4im: {
            label: "সম্পাদনা ছাঁকনি ট্রিগার করা",
            summary: "শুধুমাত্র সতর্কতা: সম্পাদনা ছাঁকনি ট্রিগার করা",
          },
        },
        "uw-chat": {
          level1: {
            label: "আলাপ পাতাকে ফোরাম হিসেবে ব্যবহার",
            summary: "সাধারণ বিজ্ঞপ্তি: আলাপ পাতাকে ফোরাম হিসেবে ব্যবহার",
          },
          level2: {
            label: "আলাপ পাতাকে ফোরাম হিসেবে ব্যবহার",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: আলাপ পাতাকে ফোরাম হিসেবে ব্যবহার",
          },
          level3: {
            label: "আলাপ পাতাকে ফোরাম হিসেবে ব্যবহার",
            summary: "তৃতীয় স্তরের সতর্কতা: আলাপ পাতাকে ফোরাম হিসেবে ব্যবহার",
          },
          level4: {
            label: "আলাপ পাতাকে ফোরাম হিসেবে ব্যবহার",
            summary: "সর্বশেষ সতর্কতা: আলাপ পাতাকে ফোরাম হিসেবে ব্যবহার",
          },
        },
        "uw-create": {
          level1: {
            label: "অনুপযুক্ত পাতা তৈরি",
            summary: "সাধারণ বিজ্ঞপ্তি: অনুপযুক্ত পাতা তৈরি",
          },
          level2: {
            label: "অনুপযুক্ত পাতা তৈরি",
            summary: "দ্বিতীয় স্তরের সতর্কতা: অনুপযুক্ত পাতা তৈরি",
          },
          level3: {
            label: "অনুপযুক্ত পাতা তৈরি",
            summary: "তৃতীয় স্তরের সতর্কতা: অনুপযুক্ত পাতা তৈরি",
          },
          level4: {
            label: "অনুপযুক্ত পাতা তৈরি",
            summary: "সর্বশেষ সতর্কতা: অনুপযুক্ত পাতা তৈরি",
          },
          level4im: {
            label: "অনুপযুক্ত পাতা তৈরি",
            summary: "একমাত্র সতর্কতা: অনুপযুক্ত পাতা তৈরি",
          },
        },
        "uw-mos": {
          level1: {
            label: "রচনাশৈলী",
            summary:
              "সাধারণ বিজ্ঞপ্তি: ফরম্যাটিং, তারিখ, ভাষা ইত্যাদি (রচনাশৈলী)",
          },
          level2: {
            label: "রচনাশৈলী",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: ফরম্যাটিং, তারিখ, ভাষা ইত্যাদি (রচনাশৈলী)",
          },
          level3: {
            label: "রচনাশৈলী",
            summary:
              "তৃতীয় স্তরের সতর্কতা: ফরম্যাটিং, তারিখ, ভাষা ইত্যাদি (রচনাশৈলী)",
          },
          level4: {
            label: "রচনাশৈলী",
            summary:
              "সর্বশেষ সতর্কতা: ফরম্যাটিং, তারিখ, ভাষা ইত্যাদি (রচনাশৈলী)",
          },
        },
        "uw-move": {
          level1: {
            label: "নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
            summary:
              "সাধারণ বিজ্ঞপ্তি: নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
          },
          level2: {
            label: "নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
          },
          level3: {
            label: "নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
            summary:
              "তৃতীয় স্তরের সতর্কতা: নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
          },
          level4: {
            label: "নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
            summary:
              "সর্বশেষ সতর্কতা: নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
          },
          level4im: {
            label: "নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
            summary:
              "একমাত্র সতর্কতা: নামকরণ রীতি বা ঐকমত্যের বিরুদ্ধে পাতা স্থানান্তর",
          },
        },
        "uw-tpv": {
          level1: {
            label: "অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা", //Refactoring others' talk page comments
            summary:
              "সাধারণ বিজ্ঞপ্তি: অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা",
          },
          level2: {
            label: "অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা",
            summary:
              "দ্বিতীয় স্তরের সতর্কতা: অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা",
          },
          level3: {
            label: "অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা",
            summary:
              "তৃতীয় স্তরের সতর্কতা: অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা",
          },
          level4: {
            label: "অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা",
            summary:
              "সর্বশেষ সতর্কতা: অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা",
          },
          level4im: {
            label: "অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা",
            summary:
              "একমাত্র সতর্কতা: অন্যদের আলাপ পাতার মন্তব্যসমূহের পুনর্বিন্যস করা",
          },
        },
        "uw-upload": {
          level1: {
            label: "অবিশ্বকোষীয় চিত্র আপলোড",
            summary: "সাধারণ বিজ্ঞপ্তি: অবিশ্বকোষীয় চিত্র আপলোড",
          },
          level2: {
            label: "অবিশ্বকোষীয় চিত্র আপলোড",
            summary: "দ্বিতীয় স্তরের সতর্কতা: অবিশ্বকোষীয় চিত্র আপলোড",
          },
          level3: {
            label: "অবিশ্বকোষীয় চিত্র আপলোড",
            summary: "তৃতীয় স্তরের সতর্কতা: অবিশ্বকোষীয় চিত্র আপলোড",
          },
          level4: {
            label: "অবিশ্বকোষীয় চিত্র আপলোড",
            summary: "সর্বশেষ সতর্কতা: অবিশ্বকোষীয় চিত্র আপলোড",
          },
          level4im: {
            label: "অবিশ্বকোষীয় চিত্র আপলোড",
            summary: "একমাত্র সতর্কতা: অবিশ্বকোষীয় চিত্র আপলোড",
          },
        },
      },
    },

    singlenotice: {
      "uw-agf-sock": {
        label: "একাধিক অ্যাকাউন্টের ব্যবহার (আস্থা রেখে)",
        summary: "বিজ্ঞপ্তি: একাধিক অ্যাকাউন্টের ব্যবহার",
      },

      /** 'uw-aiv': {
                label: 'Bad AIV report',
                summary: 'বিজ্ঞপ্তি: Bad AIV report'
            }, **/

      "uw-autobiography": {
        label: "আত্মজীবনী তৈরি",
        summary: "বিজ্ঞপ্তি: আত্মজীবনী তৈরি",
      },
      "uw-badcat": {
        label: "ভুল বিষয়শ্রেণী যোগ",
        summary: "বিজ্ঞপ্তি: ভুল বিষয়শ্রেণী যোগ",
      },
      "বাংলায় সম্পাদনা সারাংশ দিন (টুইংকল)": {
        label: "ইংরেজিতে সম্পাদনা সারাংশ দেওয়া",
        summary: "বিজ্ঞপ্তি: ইংরেজিতে সম্পাদনা সারাংশ দেওয়া",
      },
      "Uw-np": {
        label: "অ-উল্লেখযোগ্য ব্যক্তির নাম যোগ",
        summary: "বিজ্ঞপ্তি: অ-উল্লেখযোগ্য ব্যক্তির নাম যোগ",
      },
      "Uw-patrol": {
       label: "টহলদান নীতিমালা লঙ্ঘন",
       summery: "বিজ্ঞপ্তি: নিবন্ধ তৈরির ৪৮ ঘন্টা পার হওয়ার পূর্বেই রক্ষণাবেক্ষণ ট্যাগ যোগ",
       },
      "uw-badlistentry": {
        label: "তালিকায় অনুপযুক্ত ভুক্তি যোগ",
        summary: "বিজ্ঞপ্তি: তালিকায় অনুপযুক্ত ভুক্তি যোগ",
      },
      "uw-bite": {
        label: 'নবাগতদের "জ্বালাতন"',
        summary: 'বিজ্ঞপ্তি: "নবাগতদের জ্বালাতন',
        suppressArticleInSummary: true, // non-standard (user name, not article), and not necessary
      },
      "uw-coi": {
        label: "স্বার্থের সংঘাত",
        summary: "বিজ্ঞপ্তি: স্বার্থের সংঘাত",
        heading: "একটি স্বার্থের সংঘাত ব্যবস্থাপনা",
      },
      "uw-controversial": {
        label: "বিতর্কিত উপাদান যোগ",
        summary: "বিজ্ঞপ্তি: বিতর্কিত উপাদান যোগ",
      },
      "uw-copying": {
        label: "অন্য পাতায় লেখা অনুলিপি",
        summary: "বিজ্ঞপ্তি: অন্য পাতায় লেখা অনুলিপি",
      },
      "uw-crystal": {
        label: "অনুমাননির্ভর বা অনিশ্চিত তথ্য যোগ করা",
        summary: "বিজ্ঞপ্তি: অনুমাননির্ভর বা অনিশ্চিত তথ্য যোগ করা",
      },
      "uw-c&pmove": {
        label: "অনুলিপি প্রতিলিপি করে পাতা স্থানান্তর",
        summary: "বিজ্ঞপ্তি: অনুলিপি প্রতিলিপি করে পাতা স্থানান্তর",
      },
      "uw-dab": {
        label: "দ্ব্যর্থতা নিরসন পাতায় ভুল সম্পাদনা",
        summary: "বিজ্ঞপ্তি: দ্ব্যর্থতা নিরসন পাতায় ভুল সম্পাদনা",
      },
      "uw-date": {
        label: "অপ্রয়োজনে তারিখের বিন্যাস পরিবর্তন করা",
        summary: "বিজ্ঞপ্তি: অপ্রয়োজনে তারিখের বিন্যাস পরিবর্তন করা",
      },
      "uw-deadlink": {
        label: "অকার্যকর সংযোগ সম্বলিত সঠিক উৎস সরানো",
        summary: "বিজ্ঞপ্তি: অকার্যকর সংযোগ সম্বলিত সঠিক উৎস সরানো",
      },
      "uw-displaytitle": {
        label: "DISPLAYTITLE এর ভুল ব্যবহার",
        summary: "বিজ্ঞপ্তি: DISPLAYTITLE এর ভুল ব্যবহার",
      },
      "uw-draftfirst": {
        label:
          "দ্রুত মুছে ফেলার ঝুঁকি এড়াতে ব্যবহারকারীর ব্যবহারকারী নামস্থানে খসড়া তৈরি করা উচিত",
        summary:
          "বিজ্ঞপ্তি: দয়া করে [[Help:Userspace draft|ব্যবহারকারী নামস্থানে]] খসড়া তৈরি করুন",
      },
      "uw-editsummary": {
        label: "নতুন ব্যবহারকারী সম্পাদনা সারাংশ ব্যবহার করছে না",
        summary: "বিজ্ঞপ্তি: সম্পাদনা সারাংশ ব্যবহার না করা",
      },
      "uw-editsummary2": {
        label: "অভিজ্ঞ ব্যবহারকারী সম্পাদনা সারাংশ ব্যবহার করছে না",
        summary: "বিজ্ঞপ্তি: সম্পাদনা সারাংশ ব্যবহার না করা",
      },
      "uw-elinbody": {
        label: "একটি নিবন্ধের মূল অংশে বহিঃসংযোগ যোগ করা",
        summary:
          "বিজ্ঞপ্তি: বহিঃসংযোগ নিবন্ধের নিচে বহিঃসংযোগ অনুচ্ছেদে যোগ করুন",
      },
      "uw-bangla": {
        label: "বাংলায় যোগাযোগ না করা",
        summary: "বিজ্ঞপ্তি: বাংলায় যোগাযোগ না করা",
      },
      "uw-hasty": {
        label: "তাড়াহুড়ো করে দ্রুত অপসারণ ট্যাগ যোগ",
        summary:
          "বিজ্ঞপ্তি: অপসারণ ট্যাগ যোগ করার আগে প্রণেতাকে নিবন্ধটির মানোন্নয়নের সময় দিন",
      },
      "uw-italicize": {
        label:
          "নিবন্ধের মধ্যে বই, চলচ্চিত্র, অ্যালবাম, ম্যাগাজিন, টিভি সিরিজ ইত্যাদির নাম ইটালিক করুন",
        summary:
          "বিজ্ঞপ্তি: নিবন্ধের মধ্যে বই, চলচ্চিত্র, অ্যালবাম, ম্যাগাজিন, টিভি সিরিজ ইত্যাদির নাম ইটালিক করুন",
      },
      /**'uw-lang': {
                label: 'Unnecessarily changing between British and American English',
                summary: 'বিজ্ঞপ্তি: Unnecessarily changing between British and American English',
                heading: 'National varieties of English'
            }, **/ //দরকার নেই
      "uw-linking": {
        label: "লাল লিংকের অত্যধিক কিংবা বার বার নীল লিংকের ব্যবহার",
        summary:
          "বিজ্ঞপ্তি: লাল লিংকের অত্যধিক কিংবা বার বার নীল লিংকের ব্যবহার",
      },
      "uw-minor": {
        label: "অনুল্লেখ্য সম্পাদনা চেক বক্সের ভুল ব্যবহার",
        summary: "বিজ্ঞপ্তি: অনুল্লেখ্য সম্পাদনা চেক বক্সের ভুল ব্যবহার",
      },
      "uw-notbangla": {
        label: "বাংলা নয় এমন নিবন্ধ তৈরি",
        summary: "বিজ্ঞপ্তি: বাংলা নয় এমন নিবন্ধ তৈরি",
      },
      "uw-notbanglaedit": {
        label: "নিবন্ধে বাংলা নয় এমন বিষয়বস্তু সংযোজন",
        summary: "বিজ্ঞপ্তি: নিবন্ধে বাংলা নয় এমন বিষয়বস্তু সংযোজন",
      },
      "uw-notvote": {
        label: "আমরা ঐকমত্য ব্যবহার করি, ভোট নয়",
        summary: "বিজ্ঞপ্তি: আমরা ঐকমত্য ব্যবহার করি, ভোট নয়",
      },
      "uw-plagiarism": {
        label: "অ্যাট্রিবিউশন ছাড়াই পাবলিক ডোমেইন উৎস থেকে কপি করা",
        summary:
          "বিজ্ঞপ্তি: অ্যাট্রিবিউশন ছাড়াই পাবলিক ডোমেইন উৎস থেকে কপি করা",
      },
      "uw-preview": {
        label: "ভুল এড়াতে প্রাকদর্শন বাটন ব্যবহার করুন",
        summary: "বিজ্ঞপ্তি: ভুল এড়াতে প্রাকদর্শন বাটন ব্যবহার করুন",
      },
      "uw-redlink": {
        label: "নির্বিচারে লাল লিংক অপসারণ",
        summary: "বিজ্ঞপ্তি: লাল লিংক অপসারণ করার সময় সতর্ক হোন",
      },
      "uw-selfrevert": {
        label: "নিজের পরীক্ষা-নিরীক্ষা পুনর্বহাল করা",
        summary: "বিজ্ঞপ্তি: নিজের পরীক্ষা-নিরীক্ষা পুনর্বহাল করা",
      },
      "uw-socialnetwork": {
        label: "উইকিপিডিয়া সামাজিক যোগাযোগমাধ্যম নয়",
        summary: "বিজ্ঞপ্তি: উইকিপিডিয়া সামাজিক যোগাযোগমাধ্যম নয়",
      },
      "uw-sofixit": {
        label: "সাহসী হোন এবং নিজেই কোনো কিছু সংশোধন করুন",
        summary: "বিজ্ঞপ্তি: সাহস করে নিজেই কোনো কিছু সংশোধন করতে পারেন",
      },
      "uw-spoiler": {
        label: "স্পয়লার সতর্কতা যোগ অথবা যথাযথ অনুচ্ছেদ থেকে স্পয়লার অপসারণ",
        summary:
          "বিজ্ঞপ্তি: উইকিপিডিয়া নিবন্ধে সম্ভাব্য 'স্পয়লার' মুছবেন না বা পতাকাঙ্কিত করবেন না",
      },
      "uw-talkinarticle": {
        label: "নিবন্ধের ভেতরে বার্তা",
        summary: "বিজ্ঞপ্তি: নিবন্ধের ভেতরে বার্তা",
      },
      "uw-tilde": {
        label: "পোস্টে স্বাক্ষর না করা",
        summary: "বিজ্ঞপ্তি: পোস্টে স্বাক্ষর না করা",
      },
      "uw-toppost": {
        label: "আলাপ পাতার শীর্ষে বার্তা প্রদান",
        summary: "বিজ্ঞপ্তি: আলাপ পাতার শীর্ষে বার্তা প্রদান",
      },
      "uw-unattribcc": {
        label: "নির্দেশ ছাড়াই উপযুক্ত-লাইসেন্সযুক্ত উৎস থেকে অনুলিপি করা",
        summary:
          "বিজ্ঞপ্তি: নির্দেশ ছাড়াই উপযুক্ত-লাইসেন্সযুক্ত উৎস থেকে অনুলিপি করা", //Copying from compatibility-licensed sources without attribution
      },
      "uw-userspace draft finish": {
        label: "অনেক পুরাতন ব্যবহারকারী খসড়া",
        summary: "বিজ্ঞপ্তি: অনেক পুরাতন ব্যবহারকারী খসড়া",
      },
      "uw-vgscope": {
        label: "ভিডিও গেম প্লে, প্রতারণা বা নির্দেশাবলী যোগ করা",
        summary: "বিজ্ঞপ্তি: ভিডিও গেম প্লে, প্রতারণা বা নির্দেশাবলী যোগ করা",
      },
      "uw-warn": {
        label:
          "ধ্বংসপ্রবণতা পুনর্বহাল করার সময় ব্যবহারকারীকে সতর্ক বার্তা দিন",
        summary:
          "বিজ্ঞপ্তি: ধ্বংসপ্রবণতা পুনর্বহাল করার সময় ব্যবহারকারীকে সতর্কতা বার্তা দিন",
      },
      "uw-wrongsummary": {
        label: "ভুল বা অনুপযুক্ত সম্পাদনা সারাংশ ব্যবহার করা",
        summary: "সতর্কতা: ভুল বা অনুপযুক্ত সম্পাদনা সারাংশ ব্যবহার করা",
      },
    },

    singlewarn: {
      "uw-3rr": {
        label: "সম্ভাব্য তিন-প্রত্যাবর্তন নিয়ম লঙ্ঘন; uw-ew ও দেখুন",
        summary: "সতর্কতা: তিন-প্রত্যাবর্তন নিয়ম",
      },
      "uw-affiliate": {
        label: "অ্যাফিলিয়েট মার্কেটিং",
        summary: "সতর্কতা: অ্যাফিলিয়েট মার্কেটিং",
      },
      "uw-attack": {
        label: "আক্রমণাত্বক পাতা তৈরি",
        summary: "সতর্কতা: আক্রমণাত্বক পাতা তৈরি",
        suppressArticleInSummary: true,
      },
      "uw-botun": {
        label: "বট ব্যবহারকারী নাম",
        summary: "সতর্কতা: বট ব্যবহারকারী নাম",
      },
      "uw-canvass": {
        label: "ক্যানভাসিং",
        summary: "সতর্কতা: ক্যানভাসিং",
      },
      "uw-copyright": {
        label: "কপিরাইট লঙ্ঘন",
        summary: "সতর্কতা: কপিরাইট লঙ্ঘন",
      },
      "uw-copyright-link": {
        label: "কপিরাইটযুক্ত কাজের লঙ্ঘনের সাথে সংযোগ স্থাপন করা হচ্ছে", //Linking to copyrighted works violation
        summary:
          "সতর্কতা: কপিরাইটযুক্ত কাজের লঙ্ঘনের সাথে সংযোগ স্থাপন করা হচ্ছে",
      },
      "uw-copyright-new": {
        label: "কপিরাইট নীতি লঙ্ঘন (নতুন ব্যবহারকারীদের জন্য ব্যাখ্যা সহ)",
        summary: "বিজ্ঞপ্তি: কপিরাইট সমস্যা এড়ানো",
        heading: "উইকিপিডিয়া ও কপিরাইট",
      },
      "uw-copyright-remove": {
        label: "নিবন্ধ থেকে {{copyvio}} টেমপ্লেট অপসারণ",
        summary: "সতর্কতা: {{copyvio}} টেমপ্লেট অপসারণ",
      },
      "uw-efsummary": {
        label: "সম্পাদনা সারাংশে সম্পাদনা ছাঁকনি ট্রিগার করা",
        summary: "সতর্কতা: সম্পাদনা সারাংশে সম্পাদনা ছাঁকনি ট্রিগার করা",
      },
      "uw-ew": {
        label: "সম্পাদনা যুদ্ধ (শক্তিশালী শব্দ)", // Edit warring
        summary: "সতর্কতা: সম্পাদনা যুদ্ধ",
      },
      "uw-ewsoft": {
        label: "সম্পাদনা যুদ্ধ (নতুনদের জন্য নরম শব্দ)",
        summary: "সতর্কতা: সম্পাদনা যুদ্ধ",
      },
      "uw-hijacking": {
        label: "নিবন্ধ ছিনতাই", // Hijacking articles
        summary: "সতর্কতা: নিবন্ধ ছিনতাই",
      },
      "uw-hoax": {
        label: "প্রতারণা তৈরি করা", // Creating hoaxes
        summary: "সতর্কতা: প্রতারণা তৈরি করা",
      },
      "uw-legal": {
        label: "আইনি হুমকি প্রদান",
        summary: "সতর্কতা: আইনি হুমকি প্রদান",
      },
      "uw-login": {
        label: "লগ আউট অবস্থায় সম্পাদনা",
        summary: "সতর্কতা: লগ আউট অবস্থায় সম্পাদনা",
      },
      "uw-multipleIPs": {
        label: "একাধিক আইপি ব্যবহার",
        summary: "সতর্কতা: একাধিক আইপি ব্যবহার করে ধ্বংসপ্রবণতা",
      },
      "uw-pinfo": {
        label: "ব্যক্তিগত তথ্য (outing)",
        summary: "সতর্কতা: ব্যক্তিগত তথ্য",
      },
      "uw-salt": {
        label: "ভিন্ন শিরোনামের অধীনে সুরক্ষিত নিবন্ধগুলি পুনরায় তৈরি করা",
        summary:
          "বিজ্ঞপ্তি: একটি ভিন্ন শিরোনামের অধীনে সুরক্ষিত নিবন্ধগুলি পুনরায় তৈরি করা হচ্ছে",
      },
      "uw-socksuspect": {
        label: "সকপাপেট্রি",
        summary: "সতর্কতা: আপনি একজন সন্দেহভাজন [[WP:SOCK|সকপাপেট]]", // of User:...
      },
      "uw-upv": {
        label: "ব্যবহারকারী পাতা ধ্বংসপ্রবণতা",
        summary: "সতর্কতা: ব্যবহারকারী পাতা ধ্বংসপ্রবণতা",
      },
      "uw-username": {
        label: "ব্যবহারকারী নাম নীতিমালা বিরোধী",
        summary: "সতর্কতা: আপনার ব্যবহারকারী নাম সম্ভবত নীতিমালা বিরোধী",
        suppressArticleInSummary: true, // not relevant for this template
      },
      "uw-coi-username": {
        label: "ব্যবহারকারী নাম নীতিমালা বিরোধী, এবং স্বার্থের সংঘাত",
        summary: "সতর্কতা: ব্যবহারকারী নাম ও স্বার্থের সংঘাত নীতি",
        heading: "আপনার ব্যবহারকারী নাম",
      },
      "uw-userpage": {
        label: "ব্যবহারকারী পাতা বা উপপাতা নীতিমালা বিরোধী",
        summary: "সতর্কতা: ব্যবহারকারী পাতা বা উপপাতা নীতিমালা বিরোধী",
      },
    },
  };

  // Used repeatedly below across menu rebuilds
  Twinkle.warn.prev_article = null;
  Twinkle.warn.prev_reason = null;
  Twinkle.warn.talkpageObj = null;

  Twinkle.warn.callback.change_category =
    function twinklewarnCallbackChangeCategory(e) {
      var value = e.target.value;
      var sub_group = e.target.root.sub_group;
      sub_group.main_group = value;
      var old_subvalue = sub_group.value;
      var old_subvalue_re;
      if (old_subvalue) {
        if (value === "kitchensink") {
          // Exact match possible in kitchensink menu
          old_subvalue_re = new RegExp(mw.util.escapeRegExp(old_subvalue));
        } else {
          old_subvalue = old_subvalue.replace(/\d*(im)?$/, "");
          old_subvalue_re = new RegExp(
            mw.util.escapeRegExp(old_subvalue) + "(\\d*(?:im)?)$"
          );
        }
      }

      while (sub_group.hasChildNodes()) {
        sub_group.removeChild(sub_group.firstChild);
      }

      var selected = false;
      // worker function to create the combo box entries
      var createEntries = function (contents, container, wrapInOptgroup, val) {
        val = typeof val !== "undefined" ? val : value; // IE doesn't support default parameters
        // level2->2, singlewarn->''; also used to distinguish the
        // scaled levels from singlenotice, singlewarn, and custom
        var level = val.replace(/^\D+/g, "");
        // due to an apparent iOS bug, we have to add an option-group to prevent truncation of text
        // (search WT:TW archives for "Problem selecting warnings on an iPhone")
        if (wrapInOptgroup && $.client.profile().platform === "iphone") {
          var wrapperOptgroup = new Morebits.quickForm.element({
            type: "optgroup",
            label: "ব্যবহারযোগ্য টেমপ্লেটগুলো",
          });
          wrapperOptgroup = wrapperOptgroup.render();
          container.appendChild(wrapperOptgroup);
          container = wrapperOptgroup;
        }

        $.each(contents, function (itemKey, itemProperties) {
          // Skip if the current template doesn't have a version for the current level
          if (!!level && !itemProperties[val]) {
            return;
          }
          var key =
            typeof itemKey === "string" ? itemKey : itemProperties.value;
          var template = key + level;

          var elem = new Morebits.quickForm.element({
            type: "option",
            label:
              "{{" +
              template +
              "}}: " +
              (level ? itemProperties[val].label : itemProperties.label),
            value: template,
          });

          // Select item best corresponding to previous selection
          if (!selected && old_subvalue && old_subvalue_re.test(template)) {
            elem.data.selected = selected = true;
          }
          var elemRendered = container.appendChild(elem.render());
          $(elemRendered).data("messageData", itemProperties);
        });
      };
      var createGroup = function (warnGroup, label, wrapInOptgroup, val) {
        wrapInOptgroup =
          typeof wrapInOptgroup !== "undefined" ? wrapInOptgroup : true;
        var optgroup = new Morebits.quickForm.element({
          type: "optgroup",
          label: label,
        });
        optgroup = optgroup.render();
        sub_group.appendChild(optgroup);
        createEntries(warnGroup, optgroup, wrapInOptgroup, val);
      };

      switch (value) {
        case "singlenotice":
        case "singlewarn":
          createEntries(Twinkle.warn.messages[value], sub_group, true);
          break;
        case "singlecombined":
          var unSortedSinglets = $.extend(
            {},
            Twinkle.warn.messages.singlenotice,
            Twinkle.warn.messages.singlewarn
          );
          var sortedSingletMessages = {};
          Object.keys(unSortedSinglets)
            .sort()
            .forEach(function (key) {
              sortedSingletMessages[key] = unSortedSinglets[key];
            });
          createEntries(sortedSingletMessages, sub_group, true);
          break;
        case "custom":
          createEntries(Twinkle.getPref("customWarningList"), sub_group, true);
          break;
        case "kitchensink":
          ["level1", "level2", "level3", "level4", "level4im"].forEach(
            function (lvl) {
              $.each(
                Twinkle.warn.messages.levels,
                function (levelGroupLabel, levelGroup) {
                  createGroup(
                    levelGroup,
                    "Level " + lvl.slice(5) + ": " + levelGroupLabel,
                    true,
                    lvl
                  );
                }
              );
            }
          );
          createGroup(
            Twinkle.warn.messages.singlenotice,
            "Single-issue notices"
          );
          createGroup(
            Twinkle.warn.messages.singlewarn,
            "Single-issue warnings"
          );
          createGroup(Twinkle.getPref("customWarningList"), "Custom warnings");
          break;
        case "level1":
        case "level2":
        case "level3":
        case "level4":
        case "level4im":
          // Creates subgroup regardless of whether there is anything to place in it;
          // leaves "Removal of deletion tags" empty for 4im
          $.each(
            Twinkle.warn.messages.levels,
            function (groupLabel, groupContents) {
              createGroup(groupContents, groupLabel, false);
            }
          );
          break;
        case "autolevel":
          // Check user page to determine appropriate level
          var autolevelProc = function () {
            var wikitext = Twinkle.warn.talkpageObj.getPageText();
            // history not needed for autolevel
            var latest = Twinkle.warn.callbacks.dateProcessing(wikitext)[0];
            // Pseudo-params with only what's needed to parse the level i.e. no messageData
            var params = {
              sub_group: old_subvalue,
              article: e.target.root.article.value,
            };
            var lvl =
              "level" +
              Twinkle.warn.callbacks.autolevelParseWikitext(
                wikitext,
                params,
                latest
              )[1];

            // Identical to level1, etc. above but explicitly provides the level
            $.each(
              Twinkle.warn.messages.levels,
              function (groupLabel, groupContents) {
                createGroup(groupContents, groupLabel, false, lvl);
              }
            );

            // Trigger subcategory change, add select menu, etc.
            Twinkle.warn.callback.postCategoryCleanup(e);
          };

          if (Twinkle.warn.talkpageObj) {
            autolevelProc();
          } else {
            var usertalk_page = new Morebits.wiki.page(
              "ব্যবহারকারী_আলাপ:" + mw.config.get("wgRelevantUserName"),
              "পূর্ববর্তী সতর্কবার্তাসমূহ লোড হচ্ছে।"
            );
            usertalk_page.setFollowRedirect(true, false);
            usertalk_page.load(
              function (pageobj) {
                Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj
                autolevelProc();
              },
              function () {
                // Catch and warn if the talkpage can't load,
                // most likely because it's a cross-namespace redirect
                // Supersedes the typical $autolevelMessage added in autolevelParseWikitext
                var $noTalkPageNode = $("<strong/>", {
                  text: "ব্যবহারকারীর আলাপ পাতা লোড হচ্ছে না; এটি একটি ক্রস-নেমস্পেসের পুনঃনির্দেশ হতে পারে। স্বয়ংক্রিয় লেভেল সনাক্তকরণ সম্ভব নয়।",
                  id: "twinkle-warn-autolevel-message",
                  css: { color: "red" },
                });
                $noTalkPageNode.insertBefore(
                  $("#twinkle-warn-warning-messages")
                );
                // If a preview was opened while in a different mode, close it
                // Should nullify the need to catch the error in preview callback
                e.target.root.previewer.closePreview();
              }
            );
          }
          break;
        default:
          alert("টুইংকেল সতর্কীকরণে অজানা সতর্কীকরণ গ্রুপ");
          break;
      }

      // Trigger subcategory change, add select menu, etc.
      // Here because of the async load for autolevel
      if (value !== "autolevel") {
        // reset any autolevel-specific messages while we're here
        $("#twinkle-warn-autolevel-message").remove();

        Twinkle.warn.callback.postCategoryCleanup(e);
      }
    };

  Twinkle.warn.callback.postCategoryCleanup =
    function twinklewarnCallbackPostCategoryCleanup(e) {
      // clear overridden label on article textbox
      Morebits.quickForm.setElementTooltipVisibility(
        e.target.root.article,
        true
      );
      Morebits.quickForm.resetElementLabel(e.target.root.article);
      // Trigger custom label/change on main category change
      Twinkle.warn.callback.change_subcategory(e);

      // Use select2 to make the select menu searchable
      if (!Twinkle.getPref("oldSelect")) {
        $("select[name=sub_group]")
          .select2({
            width: "100%",
            matcher: Morebits.select2.matchers.optgroupFull,
            templateResult: Morebits.select2.highlightSearchMatches,
            language: {
              searching: Morebits.select2.queryInterceptor,
            },
          })
          .change(Twinkle.warn.callback.change_subcategory);

        $(".select2-selection").keydown(Morebits.select2.autoStart).focus();

        mw.util.addCSS(
          // Increase height
          ".select2-container .select2-dropdown .select2-results > .select2-results__options { max-height: 350px; }" +
            // Reduce padding
            ".select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }" +
            ".select2-results .select2-results__group { padding-top: 1px; padding-bottom: 1px; } " +
            // Adjust font size
            ".select2-container .select2-dropdown .select2-results { font-size: 13px; }" +
            ".select2-container .selection .select2-selection__rendered { font-size: 13px; }"
        );
      }
    };

  Twinkle.warn.callback.change_subcategory =
    function twinklewarnCallbackChangeSubcategory(e) {
      var main_group = e.target.form.main_group.value;
      var value = e.target.form.sub_group.value;

      // Tags that don't take a linked article, but something else (often a username).
      // The value of each tag is the label next to the input field
      var notLinkedArticle = {
        "uw-agf-sock":
          "অন্য অ্যাকাউন্টের ঐচ্ছিক ব্যবহারকারীর নাম ('ব্যবহারকারী:' ছাড়া) ",
        "uw-bite":
          "'দংশিত' ব্যবহারকারীর ব্যবহারকারীর নাম ('ব্যবহারকারী:' ছাড়া) ",
        "uw-socksuspect":
          "সক মাস্টারের ব্যবহারকারী নাম, যদি জানা থাকে ('ব্যবহারকারী:' ছাড়া) ",
        "uw-username": "ব্যবহারকারী নাম নীতিমালা ভঙ্গ করে কারণ... ",
        "uw-aiv":
          "ঐচ্ছিক ব্যবহারকারীর নাম যেটি রিপোর্ট করা হয়েছে ('ব্যবহারকারী:' ছাড়া) ",
      };

      if (
        ["singlenotice", "singlewarn", "singlecombined", "kitchensink"].indexOf(
          main_group
        ) !== -1
      ) {
        if (notLinkedArticle[value]) {
          if (Twinkle.warn.prev_article === null) {
            Twinkle.warn.prev_article = e.target.form.article.value;
          }
          e.target.form.article.notArticle = true;
          e.target.form.article.value = "";

          // change form labels according to the warning selected
          Morebits.quickForm.setElementTooltipVisibility(
            e.target.form.article,
            false
          );
          Morebits.quickForm.overrideElementLabel(
            e.target.form.article,
            notLinkedArticle[value]
          );
        } else if (e.target.form.article.notArticle) {
          if (Twinkle.warn.prev_article !== null) {
            e.target.form.article.value = Twinkle.warn.prev_article;
            Twinkle.warn.prev_article = null;
          }
          e.target.form.article.notArticle = false;
          Morebits.quickForm.setElementTooltipVisibility(
            e.target.form.article,
            true
          );
          Morebits.quickForm.resetElementLabel(e.target.form.article);
        }
      }

      // add big red notice, warning users about how to use {{uw-[coi-]username}} appropriately
      $("#tw-warn-red-notice").remove();
      var $redWarning;
      if (value === "uw-username") {
        $redWarning = $(
          "<div style='color: red;' id='tw-warn-red-notice'>{{uw-username}} <b>যথাযথ</b> কারণসহ ব্যবহার করুন।</div>"
        );

        $redWarning.insertAfter(
          Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup)
        );
      } else if (value === "uw-coi-username") {
        $redWarning = $(
          "<div style='color: red;' id='tw-warn-red-notice'>{{uw-coi-username}} <b>যথাযথ</b> কারণসহ ব্যবহার করুন।</div>"
        );
        $redWarning.insertAfter(
          Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup)
        );
      }
    };

  Twinkle.warn.callbacks = {
    getWarningWikitext: function (templateName, article, reason, isCustom) {
      var text = "{{subst:" + templateName;
      // add linked article for user warnings
      if (article) {
        // c&pmove has the source as the first parameter
        if (templateName === "uw-c&pmove") {
          text += "|to=" + article;
        } else {
          text += "|1=" + article;
        }
      }
      if (reason && !isCustom) {
        // add extra message
        if (
          templateName === "uw-csd" ||
          templateName === "uw-probation" ||
          templateName === "uw-userspacenoindex" ||
          templateName === "uw-userpage"
        ) {
          text += "|3=''" + reason + "''";
        } else {
          text += "|2=''" + reason + "''";
        }
      }
      text += "}}";

      if (reason && isCustom) {
        // we assume that custom warnings lack a {{{2}}} parameter
        text += " ''" + reason + "''";
      }

      return text + " ~~~~";
    },
    showPreview: function (form, templatename) {
      var input = Morebits.quickForm.getInputData(form);
      // Provided on autolevel, not otherwise
      templatename = templatename || input.sub_group;
      var linkedarticle = input.article;
      var templatetext;

      templatetext = Twinkle.warn.callbacks.getWarningWikitext(
        templatename,
        linkedarticle,
        input.reason,
        input.main_group === "custom"
      );

      form.previewer.beginRender(
        templatetext,
        "ব্যবহারকারী_আলাপ:" + mw.config.get("wgRelevantUserName")
      ); // Force wikitext/correct username
    },
    // Just a pass-through unless the autolevel option was selected
    preview: function (form) {
      if (form.main_group.value === "autolevel") {
        // Always get a new, updated talkpage for autolevel processing
        var usertalk_page = new Morebits.wiki.page(
          "ব্যবহারকারী_আলাপ:" + mw.config.get("wgRelevantUserName"),
          "পূর্ববর্তী সতর্কবার্তা গুলো লোড হচ্ছে।"
        );
        usertalk_page.setFollowRedirect(true, false);
        // Will fail silently if the talk page is a cross-ns redirect,
        // removal of the preview box handled when loading the menu
        usertalk_page.load(function (pageobj) {
          Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj

          var wikitext = pageobj.getPageText();
          // history not needed for autolevel
          var latest = Twinkle.warn.callbacks.dateProcessing(wikitext)[0];
          var params = {
            sub_group: form.sub_group.value,
            article: form.article.value,
            messageData: $(form.sub_group)
              .find('option[value="' + $(form.sub_group).val() + '"]')
              .data("messageData"),
          };
          var template = Twinkle.warn.callbacks.autolevelParseWikitext(
            wikitext,
            params,
            latest
          )[0];
          Twinkle.warn.callbacks.showPreview(form, template);

          // If the templates have diverged, fake a change event
          // to reload the menu with the updated pageobj
          if (form.sub_group.value !== template) {
            var evt = document.createEvent("Event");
            evt.initEvent("change", true, true);
            form.main_group.dispatchEvent(evt);
          }
        });
      } else {
        Twinkle.warn.callbacks.showPreview(form);
      }
    },
    /**
     * Used in the main and autolevel loops to determine when to warn
     * about excessively recent, stale, or identical warnings.
     * @param {string} wikitext  The text of a user's talk page, from getPageText()
     * @returns {Object[]} - Array of objects: latest contains most recent
     * warning and date; history lists all prior warnings
     */
    dateProcessing: function (wikitext) {
      var history_re =
        /<!--\s?Template:([uU]w-.*?)\s?-->.*?(\d{1,2}:\d{1,2}, \d{1,2} \w+ \d{4} \(UTC\))/g;
      var history = {};
      var latest = { date: new Morebits.date(0), type: "" };
      var current;

      while ((current = history_re.exec(wikitext)) !== null) {
        var template = current[1],
          current_date = new Morebits.date(current[2]);
        if (
          !(template in history) ||
          history[template].isBefore(current_date)
        ) {
          history[template] = current_date;
        }
        if (!latest.date.isAfter(current_date)) {
          latest.date = current_date;
          latest.type = template;
        }
      }
      return [latest, history];
    },
    /**
     * Main loop for deciding what the level should increment to. Most of
     * this is really just error catching and updating the subsequent data.
     * May produce up to two notices in a twinkle-warn-autolevel-messages div
     *
     * @param {string} wikitext  The text of a user's talk page, from getPageText() (required)
     * @param {Object} params  Params object: sub_group is the template (required);
     * article is the user-provided article (form.article) used to link ARV on recent level4 warnings;
     * messageData is only necessary if getting the full template, as it's
     * used to ensure a valid template of that level exists
     * @param {Object} latest  First element of the array returned from
     * dateProcessing. Provided here rather than processed within to avoid
     * repeated call to dateProcessing
     * @param {(Date|Morebits.date)} date  Date from which staleness is determined
     * @param {Morebits.status} statelem  Status element, only used for handling error in final execution
     *
     * @returns {Array} - Array that contains the full template and just the warning level
     */
    autolevelParseWikitext: function (
      wikitext,
      params,
      latest,
      date,
      statelem
    ) {
      var level; // undefined rather than '' means the isNaN below will return true
      if (/\d(?:im)?$/.test(latest.type)) {
        // level1-4im
        level = parseInt(latest.type.replace(/.*(\d)(?:im)?$/, "$1"), 10);
      } else if (latest.type) {
        // Non-numbered warning
        // Try to leverage existing categorization of
        // warnings, all but one are universally lowercased
        var loweredType = /uw-multipleIPs/i.test(latest.type)
          ? "uw-multipleIPs"
          : latest.type.toLowerCase();
        // It would be nice to account for blocks, but in most
        // cases the hidden message is terminal, not the sig
        if (Twinkle.warn.messages.singlewarn[loweredType]) {
          level = 3;
        } else {
          level = 1; // singlenotice or not found
        }
      }

      var $autolevelMessage = $("<div/>", {
        id: "twinkle-warn-autolevel-message",
      });

      if (isNaN(level)) {
        // No prior warnings found, this is the first
        level = 1;
      } else if (level > 4 || level < 1) {
        // Shouldn't happen
        var message =
          "পূর্ববর্তী সতর্কতা স্তর পার্স করতে অক্ষম, দয়া করে হাত দ্বারা একটি সতর্কতা স্তর নির্বাচন করুন৷";
        if (statelem) {
          statelem.error(message);
        } else {
          alert(message);
        }
        return;
      } else {
        date = date || new Date();
        var autoTimeout = new Morebits.date(latest.date.getTime()).add(
          parseInt(Twinkle.getPref("autolevelStaleDays"), 10),
          "days"
        );
        if (autoTimeout.isAfter(date)) {
          if (level === 4) {
            level = 4;
            // Basically indicates whether we're in the final Main evaluation or not,
            // and thus whether we can continue or need to display the warning and link
            if (!statelem) {
              var $link = $("<a/>", {
                href: "#",
                text: "ARV টুলটি চালু করতে এখানে ক্লিক করুন।",
                css: { fontWeight: "bold" },
                click: function () {
                  Morebits.wiki.actionCompleted.redirect = null;
                  Twinkle.warn.dialog.close();
                  Twinkle.arv.callback(mw.config.get("wgRelevantUserName"));
                  $("input[name=page]").val(params.article); // Target page
                  $("input[value=final]").prop("checked", true); // Vandalism after final
                },
              });
              var statusNode = $("<div/>", {
                text:
                  mw.config.get("wgRelevantUserName") +
                  " সম্প্রতি চতুর্থ স্তরের সতর্কতা বার্তা পেয়েছেন (" +
                  latest.type +
                  ") তাই সম্ভবত অভিযোগ করা ভালো হবে; ",
                css: { color: "red" },
              });
              statusNode.append($link[0]);
              $autolevelMessage.append(statusNode);
            }
          } else {
            // Automatically increase severity
            level += 1;
          }
        } else {
          // Reset warning level if most-recent warning is too old
          level = 1;
        }
      }

      $autolevelMessage.prepend(
        $(
          '<div>একটা ইস্যু সৃষ্টি করবে যা, <span style="font-weight: bold;">লেভেল ' +
            level +
            "</span> টেমপ্লেটে।</div>"
        )
      );
      // Place after the stale and other-user-reverted (text-only) messages
      $("#twinkle-warn-autolevel-message").remove(); // clean slate
      $autolevelMessage.insertAfter($("#twinkle-warn-warning-messages"));

      var template = params.sub_group.replace(/(.*)\d$/, "$1");
      // Validate warning level, falling back to the uw-generic series.
      // Only a few items are missing a level, and in all but a handful
      // of cases, the uw-generic series is explicitly used elsewhere per WP:UTM.
      if (params.messageData && !params.messageData["level" + level]) {
        template = "uw-generic";
      }
      template += level;

      return [template, level];
    },
    main: function (pageobj) {
      var text = pageobj.getPageText();
      var statelem = pageobj.getStatusElement();
      var params = pageobj.getCallbackParameters();
      var messageData = params.messageData;

      // JS somehow didn't get destructured assignment until ES6 so of course IE doesn't support it
      var warningHistory = Twinkle.warn.callbacks.dateProcessing(text);
      var latest = warningHistory[0];
      var history = warningHistory[1];

      var now = new Morebits.date(pageobj.getLoadTime());

      Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj, just in case
      if (params.main_group === "autolevel") {
        // [template, level]
        var templateAndLevel = Twinkle.warn.callbacks.autolevelParseWikitext(
          text,
          params,
          latest,
          now,
          statelem
        );

        // Only if there's a change from the prior display/load
        if (
          params.sub_group !== templateAndLevel[0] &&
          !confirm(
            "{{" +
              templateAndLevel[0] +
              "}} টেমপ্লেটটি ব্যবহারকারীর জন্য একটি ইস্যু তৈরি করবে, ঠিক আছে?"
          )
        ) {
          statelem.error("ব্যবহারকারীর অনুরোধে বাতিল করা হয়েছে");
          return;
        }
        // Update params now that we've selected a warning
        params.sub_group = templateAndLevel[0];
        messageData = params.messageData["level" + templateAndLevel[1]];
      } else if (params.sub_group in history) {
        if (
          new Morebits.date(history[params.sub_group])
            .add(1, "day")
            .isAfter(now)
        ) {
          if (
            !confirm(
              "An identical " +
                params.sub_group +
                " গত ২৪ ঘন্টায় ইস্যুগুলো হয়েছে।  \nআপনি কি এখনও এই সতর্কবার্তা/বিজ্ঞপ্তি যোগ করতে চান?"
            )
          ) {
            statelem.error("ব্যবহারকারীর অনুরোধে বাতিল করা হয়েছে");
            return;
          }
        }
      }

      latest.date.add(1, "minute"); // after long debate, one minute is max

      if (latest.date.isAfter(now)) {
        if (
          !confirm(
            "একটি ইস্যু" +
              latest.type +
              " শেষ মিনিটে উত্থাপিত হয়েছে। \nআপনি কি এখনও এই সতর্কবার্তা/বিজ্ঞপ্তি যোগ করতে চান?"
          )
        ) {
          statelem.error("aborted per user request");
          return;
        }
      }

      // build the edit summary
      // Function to handle generation of summary prefix for custom templates
      var customProcess = function (template) {
        template = template.split("|")[0];
        var prefix;
        switch (template.substr(-1)) {
          case "1":
            prefix = "সাধারণ মন্তব্য";
            break;
          case "2":
            prefix = "সতর্কবার্তা";
            break;
          case "3":
            prefix = "সতর্কবার্তা";
            break;
          case "4":
            prefix = "সর্বশেষ সতর্কবার্তা";
            break;
          case "m":
            if (template.substr(-3) === "4im") {
              prefix = "একমাত্র সতর্কবার্তা";
              break;
            }
          // falls through
          default:
            prefix = "বিজ্ঞপ্তি";
            break;
        }
        return (
          prefix +
          ": " +
          Morebits.string.toUpperCaseFirstChar(messageData.label)
        );
      };

      var summary;
      if (params.main_group === "custom") {
        summary = customProcess(params.sub_group);
      } else {
        // Normalize kitchensink to the 1-4im style
        if (
          params.main_group === "kitchensink" &&
          !/^D+$/.test(params.sub_group)
        ) {
          var sub = params.sub_group.substr(-1);
          if (sub === "m") {
            sub = params.sub_group.substr(-3);
          }
          // Don't overwrite uw-3rr, technically unnecessary
          if (/\d/.test(sub)) {
            params.main_group = "level" + sub;
          }
        }
        // singlet || level1-4im, no need to /^\D+$/.test(params.main_group)
        summary =
          messageData.summary ||
          (messageData[params.main_group] &&
            messageData[params.main_group].summary);
        // Not in Twinkle.warn.messages, assume custom template
        if (!summary) {
          summary = customProcess(params.sub_group);
        }
        if (messageData.suppressArticleInSummary !== true && params.article) {
          if (
            params.sub_group === "uw-agf-sock" ||
            params.sub_group === "uw-socksuspect" ||
            params.sub_group === "uw-aiv"
          ) {
            // these templates require a username
            summary += " [[:ব্যাবহারকারী:" + params.article + "]] পাতায়";
          } else {
            summary += " [[:" + params.article + "]] পাতায়";
          }
        }
      }

      pageobj.setEditSummary(summary + "।");
      pageobj.setChangeTags(Twinkle.changeTags);
      pageobj.setWatchlist(Twinkle.getPref("watchWarnings"));

      // Get actual warning text
      var warningText = Twinkle.warn.callbacks.getWarningWikitext(
        params.sub_group,
        params.article,
        params.reason,
        params.main_group === "custom"
      );
      if (
        Twinkle.getPref("showSharedIPNotice") &&
        mw.util.isIPAddress(mw.config.get("wgTitle"))
      ) {
        Morebits.status.info(
          "তথ্য",
          "একটি শেয়ার করা আইপি নোটিশ যোগ করা হচ্ছে।"
        );
        warningText += "\n{{subst:Shared IP advice}}";
      }

      var sectionExists = false,
        sectionNumber = 0;
      // Only check sections if there are sections or there's a chance we won't create our own
      if (!messageData.heading && text.length) {
        // Get all sections
        var sections = text.match(/^(==*).+\1/gm);
        if (sections && sections.length !== 0) {
          // Find the index of the section header in question
          var dateHeaderRegex = now.monthHeaderRegex();
          sectionNumber = 0;
          // Find this month's section among L2 sections, preferring the bottom-most
          sectionExists = sections.reverse().some(function (sec, idx) {
            return (
              /^(==)[^=].+\1/m.test(sec) &&
              dateHeaderRegex.test(sec) &&
              typeof (sectionNumber = sections.length - 1 - idx) === "number"
            );
          });
        }
      }

      if (sectionExists) {
        // append to existing section
        pageobj.setPageSection(sectionNumber + 1);
        pageobj.setAppendText("\n\n" + warningText);
        pageobj.append();
      } else {
        if (messageData.heading) {
          // create new section
          pageobj.setNewSectionTitle(messageData.heading);
        } else {
          Morebits.status.info(
            "তথ্য",
            "যেহেতু কিছুই পাওয়া যায় নি, তাই এই মাসের জন্য নতুন অনুচ্ছেদ তৈরি করা হবে"
          );
          pageobj.setNewSectionTitle(now.monthHeader(0));
        }
        pageobj.setNewSectionText(warningText);
        pageobj.newSection();
      }
    },
  };

  Twinkle.warn.callback.evaluate = function twinklewarnCallbackEvaluate(e) {
    var userTalkPage =
      "ব্যবহারকারী_আলাপ:" + mw.config.get("wgRelevantUserName");

    // reason, main_group, sub_group, article
    var params = Morebits.quickForm.getInputData(e.target);

    // Check that a reason was filled in if uw-username was selected
    if (params.sub_group === "uw-username" && !params.article) {
      alert(
        "{{uw-username}} এই টেমপ্লেটি ব্যবহারের জন্য আপনাকে সঠিক কারণ দর্শাতে হবে।"
      );
      return;
    }

    // The autolevel option will already know by now if a user talk page
    // is a cross-namespace redirect (via !!Twinkle.warn.talkpageObj), so
    // technically we could alert an error here, but the user will have
    // already ignored the bold red error above.  Moreover, they probably
    // *don't* want to actually issue a warning, so the error handling
    // after the form is submitted is probably preferable

    // Find the selected <option> element so we can fetch the data structure
    var $selectedEl = $(e.target.sub_group).find(
      'option[value="' + $(e.target.sub_group).val() + '"]'
    );
    params.messageData = $selectedEl.data("messageData");

    Morebits.simpleWindow.setButtonsEnabled(false);
    Morebits.status.init(e.target);

    Morebits.wiki.actionCompleted.redirect = userTalkPage;
    Morebits.wiki.actionCompleted.notice =
      "সতর্কবার্তা প্রদান করা হয়েছে, কয়েক সেকেন্ডের মধ্যে আলাপ পাতা পুনঃলোড করা হবে";

    var wikipedia_page = new Morebits.wiki.page(
      userTalkPage,
      "আলাপ পাতা পরিবর্তন"
    );
    wikipedia_page.setCallbackParameters(params);
    wikipedia_page.setFollowRedirect(true, false);
    wikipedia_page.load(Twinkle.warn.callbacks.main);
  };

  Twinkle.addInitCallback(Twinkle.warn, "warn");
})(jQuery);

// </nowiki>

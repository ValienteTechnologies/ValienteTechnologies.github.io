---
---
$(function() {

  var $fields = $("#contactForm input,#contactForm textarea");
  var $submitButton = $("#sendMessageButton");
  var buttonTexts = {
    default: $.trim($submitButton.data("default-text")) || $.trim($submitButton.text()) || "✉️",
    sending: $.trim($submitButton.data("sending-text")) || "⏳",
    success: $.trim($submitButton.data("success-text")) || "✅",
    error: $.trim($submitButton.data("error-text")) || "⚠️",
    invalid: $.trim($submitButton.data("invalid-text")) || "❗️",
  };

  function setButtonState(state, label) {
    $submitButton.removeClass("is-loading is-success is-error");
    if (state) {
      $submitButton.addClass("is-" + state);
    }
    $submitButton.text(label || buttonTexts.default);
  }

  function scheduleButtonReset(delay) {
    setTimeout(function() {
      setButtonState(null, buttonTexts.default);
    }, delay || 2400);
  }

  function flagInvalidFields(targets) {
    var $targets = targets && targets.length ? targets : $fields.filter(function() {
      if (typeof this.checkValidity === "function") {
        return !this.checkValidity();
      }
      return this.hasAttribute("required") && !$(this).val().trim();
    });

    $targets.each(function() {
      var $field = $(this);
      $field.addClass("contact-field-error");
      setTimeout(function() {
        $field.removeClass("contact-field-error");
      }, 1200);
    });

    return $targets.length;
  }

  $fields.on("input blur", function() {
    var $field = $(this);
    if ($field.val().trim().length) {
      $field.removeClass("contact-field-error");
    }
  });

  $fields.jqBootstrapValidation({
    preventSubmit: true,
    submitError: function($form, event, errors) {
      setButtonState("error", buttonTexts.invalid);
      flagInvalidFields();
      scheduleButtonReset();
    },
    submitSuccess: function($form, event) {
      event.preventDefault(); // prevent default submit behaviour
      var url = "https://formspree.io/" + "{% if site.formspree_form_path %}{{ site.formspree_form_path }}{% else %}{{ site.email }}{% endif %}";
      var payload = {
        name: $("input#name").val(),
        phone: $("input#phone").val(),
        email: $("input#email").val(),
        subject: $("input#subject").val(),
        message: $("textarea#message").val()
      };

      var emptyFields = $fields.filter(function() {
        return !$.trim($(this).val());
      });
      if (emptyFields.length) {
        $submitButton.prop("disabled", false);
        setButtonState("error", buttonTexts.invalid);
        flagInvalidFields(emptyFields);
        scheduleButtonReset();
        return;
      }

      $submitButton.prop("disabled", true); // Disable submit button during request
      setButtonState("loading", buttonTexts.sending);

      $.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        headers: {
          Accept: "application/json"
        },
        data: payload,
        cache: false,
      }).done(function() {
        setButtonState("success", buttonTexts.success);
        $("#contactForm").trigger("reset");
        scheduleButtonReset(2600);
      }).fail(function() {
        setButtonState("error", buttonTexts.error);
        scheduleButtonReset(3000);
      }).always(function() {
        setTimeout(function() {
          $submitButton.prop("disabled", false); // Re-enable submit button after short delay
        }, 600);
      });
    },
    filter: function() {
      return $(this).is(":visible");
    },
  });

  $("a[data-toggle=\"tab\"]").click(function(e) {
    e.preventDefault();
    $(this).tab("show");
  });
});

$(function() {
  var $form = $("#contactForm");
  if (!$form.length) return;

  var $fields = $form.find("input, textarea").not('[name="_gotcha"], [type="hidden"]');
  var $submitButton = $("#sendMessageButton");
  var $status = $form.find(".contact-form-status");
  var resetTimeout;

  // Validation patterns, keyed by input type (not id) so the same rules
  // apply to every form that reuses this script, regardless of field ids.
  var patterns = {
    email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
    tel: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/
  };

  // Messages come from data-* attributes set server-side from _data/*.yml,
  // so this script stays language-agnostic.
  var messages = {
    required: $form.data("msg-required"),
    invalidEmail: $form.data("msg-invalid-email"),
    invalidPhone: $form.data("msg-invalid-phone"),
    sending: $form.data("msg-sending"),
    success: $form.data("msg-success"),
    error: $form.data("msg-error")
  };

  var buttonStates = {
    default: { icon: "fa-paper-plane", class: "" },
    sending: { icon: "fa-spinner fa-spin", class: "is-loading" },
    success: { icon: "fa-check-circle", class: "is-success" },
    error: { icon: "fa-exclamation-circle", class: "is-error" },
    invalid: { icon: "fa-exclamation-triangle", class: "is-validation-error" }
  };

  function setButtonState(state, resetDelay) {
    clearTimeout(resetTimeout);
    var config = buttonStates[state] || buttonStates.default;

    $submitButton
      .removeClass("is-loading is-success is-error is-validation-error")
      .addClass(config.class || "")
      .html('<i class="fas ' + config.icon + '" aria-hidden="true"></i>');

    if (resetDelay) {
      resetTimeout = setTimeout(function() { setButtonState("default"); }, resetDelay);
    }
  }

  function setStatus(text, isError) {
    $status.text(text || "").toggleClass("is-error", !!isError);
  }

  function messageFor($field) {
    var value = $.trim($field.val());
    var type = $field.attr("type");

    if ($field.prop("required") && !value) return messages.required;
    if (value && type === "email" && !patterns.email.test(value)) return messages.invalidEmail;
    if (value && type === "tel" && !patterns.tel.test(value)) return messages.invalidPhone;
    return null;
  }

  function fieldMessageEl($field) {
    var id = $field.attr("id");
    return id ? $("#" + id + "-error") : $();
  }

  function showFieldError($field, msg) {
    $field.attr("aria-invalid", "true").addClass("contact-field-error");
    var $msg = fieldMessageEl($field);
    if ($msg.length) {
      $msg.text(msg || "").removeAttr("hidden");
    }
  }

  function clearFieldError($field) {
    $field.removeAttr("aria-invalid").removeClass("contact-field-error");
    var $msg = fieldMessageEl($field);
    if ($msg.length) {
      $msg.text("").attr("hidden", "hidden");
    }
  }

  function validateField($field) {
    var msg = messageFor($field);
    if (msg) {
      showFieldError($field, msg);
      return msg;
    }
    clearFieldError($field);
    return null;
  }

  // Errors clear as soon as the visitor edits the field again.
  $fields.on("input", function() {
    clearFieldError($(this));
  });

  // Real-time validation on blur.
  $fields.on("blur", function() {
    validateField($(this));
  });

  // Form submission
  $form.on("submit", function(e) {
    e.preventDefault();

    var firstErrorMsg = null;
    var $invalidFields = $fields.filter(function() {
      var msg = validateField($(this));
      if (msg && !firstErrorMsg) firstErrorMsg = msg;
      return !!msg;
    });

    if ($invalidFields.length) {
      setButtonState("invalid", 2400);
      setStatus(firstErrorMsg, true);
      $invalidFields.first().focus();
      return false;
    }

    $submitButton.prop("disabled", true);
    setButtonState("sending");
    setStatus(messages.sending);

    $.ajax({
      url: $form.data("action"),
      type: "POST",
      dataType: "json",
      headers: { Accept: "application/json" },
      data: $form.serialize(),
      cache: false
    }).done(function() {
      setButtonState("success", 2600);
      setStatus(messages.success);
      $form[0].reset();
      $fields.each(function() { clearFieldError($(this)); });
    }).fail(function() {
      setButtonState("error", 3000);
      setStatus(messages.error, true);
    }).always(function() {
      setTimeout(function() { $submitButton.prop("disabled", false); }, 600);
    });
  });

  setButtonState("default");
});

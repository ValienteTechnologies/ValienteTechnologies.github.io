---
---
$(function() {
  var $form = $("#contactForm");
  var $fields = $form.find("input, textarea");
  var $submitButton = $("#sendMessageButton");
  var resetTimeout;

  // Validation patterns
  var patterns = {
    email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
    phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/
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
      .html('<i class="fas ' + config.icon + '"></i>');
    
    if (resetDelay) {
      resetTimeout = setTimeout(function() { setButtonState("default"); }, resetDelay);
    }
  }

  function validateField($field) {
    var value = $.trim($field.val());
    var id = $field.attr("id");
    
    if ($field.prop("required") && !value) return false;
    if (id in patterns && value && !patterns[id].test(value)) return false;
    
    return true;
  }

  function showFieldErrors($invalidFields) {
    if (!$invalidFields.length) return;
    
    $invalidFields.addClass("contact-field-error");
    $invalidFields[0].scrollIntoView({ behavior: "smooth", block: "center" });
    
    setTimeout(function() { $invalidFields.first().focus(); }, 300);
    setTimeout(function() { $invalidFields.removeClass("contact-field-error"); }, 1200);
  }

  // Real-time validation
  $fields.on("blur", function() {
    if (validateField($(this))) {
      $(this).removeClass("contact-field-error");
    }
  });

  // Form submission
  $form.on("submit", function(e) {
    e.preventDefault();
    
    var $invalidFields = $fields.filter(function() {
      return !validateField($(this));
    });
    
    if ($invalidFields.length) {
      setButtonState("invalid", 2400);
      showFieldErrors($invalidFields);
      return false;
    }
    
    $submitButton.prop("disabled", true);
    setButtonState("sending");

    $.ajax({
      url: "https://formspree.io/{% if site.formspree_form_path %}{{ site.formspree_form_path }}{% else %}{{ site.email }}{% endif %}",
      type: "POST",
      dataType: "json",
      headers: { Accept: "application/json" },
      data: $form.serialize(),
      cache: false
    }).done(function() {
      setButtonState("success", 2600);
      $form[0].reset();
    }).fail(function() {
      setButtonState("error", 3000);
    }).always(function() {
      setTimeout(function() { $submitButton.prop("disabled", false); }, 600);
    });
  });

  setButtonState("default");
});

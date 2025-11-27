$(function() {

  var $fields = $("#contactForm input,#contactForm textarea");
  var $submitButton = $("#sendMessageButton");

  // Email validation regex (RFC 5322 simplified) - requires valid domain with TLD
  var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  // Phone validation regex (international format support)
  var phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;

  var buttonStates = {
    default: { icon: "fa-paper-plane", class: "" },
    sending: { icon: "fa-spinner fa-spin", class: "is-loading" },
    success: { icon: "fa-check-circle", class: "is-success" },
    error: { icon: "fa-exclamation-circle", class: "is-error" },
    invalid: { icon: "fa-exclamation-triangle", class: "is-validation-error" }
  };

  function setButtonState(state) {
    var stateConfig = buttonStates[state] || buttonStates.default;
    $submitButton.removeClass("is-loading is-success is-error is-validation-error");
    
    if (stateConfig.class) {
      $submitButton.addClass(stateConfig.class);
    }
    
    $submitButton.html('<i class="fas ' + stateConfig.icon + '"></i>');
  }

  function scheduleButtonReset(delay) {
    setTimeout(function() {
      setButtonState("default");
    }, delay || 2400);
  }

  function validateField($field) {
    var value = $.trim($field.val());
    var id = $field.attr("id");
    
    // Check if empty
    if ($field.prop("required") && !value) {
      return { valid: false, message: "This field is required" };
    }
    
    // Email validation
    if (id === "email" && value && !emailRegex.test(value)) {
      return { valid: false, message: "Please enter a valid email address" };
    }
    
    // Phone validation
    if (id === "phone" && value && !phoneRegex.test(value)) {
      return { valid: false, message: "Please enter a valid phone number" };
    }
    
    return { valid: true };
  }

  function flagInvalidFields(targets) {
    var $targets = targets && targets.length ? targets : $fields.filter(function() {
      return !validateField($(this)).valid;
    });

    $targets.each(function() {
      var $field = $(this);
      $field.addClass("contact-field-error");
      
      // Scroll to first error field
      if ($targets.first().is($field)) {
        $field[0].scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function() {
          $field.focus();
        }, 300);
      }
      
      setTimeout(function() {
        $field.removeClass("contact-field-error");
      }, 1200);
    });

    return $targets.length;
  }

  // Real-time validation feedback
  $fields.on("input blur", function() {
    var $field = $(this);
    var validation = validateField($field);
    
    if (validation.valid) {
      $field.removeClass("contact-field-error");
    }
  });

  // Custom validation on submit
  $("#contactForm").on("submit", function(event) {
    event.preventDefault();
    
    // Validate all fields
    var invalidFields = [];
    $fields.each(function() {
      var $field = $(this);
      var validation = validateField($field);
      if (!validation.valid) {
        invalidFields.push($field);
      }
    });
    
    // If there are invalid fields, show validation error
    if (invalidFields.length > 0) {
      setButtonState("invalid");
      flagInvalidFields($(invalidFields));
      scheduleButtonReset();
      return false;
    }
    
    // All fields valid, proceed with submission
    var url = "https://formspree.io/" + "{% if site.formspree_form_path %}{{ site.formspree_form_path }}{% else %}{{ site.email }}{% endif %}";
    var payload = {
      name: $("input#name").val(),
      phone: $("input#phone").val(),
      email: $("input#email").val(),
      subject: $("input#subject").val(),
      message: $("textarea#message").val()
    };

    $submitButton.prop("disabled", true);
    setButtonState("sending");

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
      setButtonState("success");
      $("#contactForm").trigger("reset");
      scheduleButtonReset(2600);
    }).fail(function() {
      setButtonState("error");
      scheduleButtonReset(3000);
    }).always(function() {
      setTimeout(function() {
        $submitButton.prop("disabled", false);
      }, 600);
    });
    
    return false;
  });

  // Initialize button state
  setButtonState("default");
});

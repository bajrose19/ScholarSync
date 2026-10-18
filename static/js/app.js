(function () {
  var form = document.querySelector("[data-steps]");
  if (!form) return;
  var steps = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
  var next = form.querySelector("[data-next]");
  var back = form.querySelector("[data-back]");
  var finish = form.querySelector("[data-finish]");
  var bars = Array.prototype.slice.call(form.querySelectorAll(".progress span"));
  var index = 0;

  function show(nextIndex) {
    index = nextIndex;
    steps.forEach(function (step, stepIndex) {
      step.hidden = stepIndex !== index;
    });
    bars.forEach(function (bar, barIndex) {
      bar.classList.toggle("on", barIndex <= index);
    });
    back.hidden = index === 0;
    next.hidden = index === steps.length - 1;
    finish.hidden = index !== steps.length - 1;
  }

  function stepReady() {
    if (index === 0) {
      var name = form.querySelector("[name=full_name]");
      return name && name.value.trim().length > 0;
    }
    if (index === 1 && form.getAttribute("data-role") === "student") {
      return form.querySelector("[name=skills]:checked, [name=interests]:checked") ||
        (form.querySelector("[name=custom_skills]") && form.querySelector("[name=custom_skills]").value.trim()) ||
        (form.querySelector("[name=custom_interests]") && form.querySelector("[name=custom_interests]").value.trim());
    }
    if (index === 1) {
      return form.querySelector("[name=research_areas]:checked");
    }
    return true;
  }

  next.addEventListener("click", function () {
    if (!stepReady()) {
      window.alert("Add the required details before continuing.");
      return;
    }
    show(Math.min(index + 1, steps.length - 1));
  });
  back.addEventListener("click", function () {
    show(Math.max(index - 1, 0));
  });
  show(0);
})();

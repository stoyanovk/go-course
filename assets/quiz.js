/* Reusable quiz widget for the Go course.
   Markup:
   <div class="quiz" data-answer="0">
     <p class="q">Question?</p>
     <button>option A</button>
     <button>option B</button>
     <p class="fb" data-ok="Yes — why." data-no="Not quite — why."></p>
   </div>
   data-answer = index (0-based) of the correct button.
   Click any button: correct turns green, wrong turns red and reveals the answer.
   Feedback text comes from data-ok / data-no on the .fb element. */
document.addEventListener("click", function (e) {
  var btn = e.target.closest(".quiz button");
  if (!btn) return;
  var quiz = btn.closest(".quiz");
  var buttons = Array.prototype.slice.call(quiz.querySelectorAll("button"));
  var answer = parseInt(quiz.getAttribute("data-answer"), 10);
  var picked = buttons.indexOf(btn);
  var fb = quiz.querySelector(".fb");

  buttons.forEach(function (b, i) {
    b.classList.remove("correct", "wrong");
    if (i === answer) b.classList.add("correct");
  });
  if (picked !== answer) btn.classList.add("wrong");

  if (fb) {
    fb.textContent = picked === answer
      ? (fb.getAttribute("data-ok") || "Correct.")
      : (fb.getAttribute("data-no") || "Try again — see the correct one highlighted.");
  }
});

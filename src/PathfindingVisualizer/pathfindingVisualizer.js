const dropdown = document.querySelectorAll(".dropdown-toggle");

dropdown.forEach(function (item) {
    item.addEventListener("click", function (e) {
        const parent = e.currentTarget.parentElement;
        console.log(parent);
        const content = parent.querySelector(".dropdown-content");
        content.classList.toggle("show-dropdown");
    });
});
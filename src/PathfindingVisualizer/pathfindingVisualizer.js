const dropdownBtns = document.querySelectorAll(".dropdown-toggle");
const dropdownContent = document.querySelectorAll(".dropdown-content");

dropdownBtns.forEach(function (item) {
    item.addEventListener("click", function (e) {
        const parent = e.currentTarget.parentElement;
        const content = parent.querySelector(".dropdown-content");
        dropdownContent.forEach(function (contents) {
            if(contents !== content){
                contents.classList.remove("show-dropdown");
            }
        });
        content.classList.toggle("show-dropdown");
    });
});

document.addEventListener("click", function (clicked) {
    dropdownBtns.forEach(function (item) {
        const parent = item.parentElement;
        const content = parent.querySelector(".dropdown-content");
        if(clicked.target !== item){
            content.classList.remove("show-dropdown");
        }
    });
});
document.addEventListener("DOMContentLoaded", () => {

    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    if (password) {
        password.addEventListener('input', () => {
            const pass = password.value;
            if (pass.length < 8) {
                password.setCustomValidity('Password must be at least 8 characters long.');
            } else if (!/[A-Z]/.test(pass)) {
                password.setCustomValidity('Password must contain at least one uppercase letter.');
            } else if (!/[a-z]/.test(pass)) {
                password.setCustomValidity('Password must contain at least one lowercase letter.');
            } else if (!/[0-9]/.test(pass)) {
                password.setCustomValidity('Password must contain at least one digit.');
            } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
                password.setCustomValidity('Password must contain at least one special character.');
            } else {
                password.setCustomValidity('');
            }
        });
    }

    if (confirmPassword && password) {
        confirmPassword.addEventListener('input', () => {
            if (confirmPassword.value !== password.value) {
                confirmPassword.setCustomValidity('Passwords do not match.');
            } else {
                confirmPassword.setCustomValidity('');
            }
        });
    }


    const icons = document.getElementsByClassName("edit");
    const forms = document.getElementsByClassName("section-updateTask");
    const tasks = document.getElementsByClassName("task");
    const inputs = document.getElementsByClassName("updatedTask");
    if (tasks == 0) {
        document.getElementsByClassName("task-hr")[0].remove();
    }
    for (let i = 0; i < icons.length; i++) {
        icons[i].addEventListener("click", () => {

            for (let j = 0; j < icons.length; j++) {
                if (i == j)
                    continue;
                icons[j].innerText = "edit";
                icons[j].setAttribute("clicked", "false")
                if (forms[j]) { forms[j].classList.remove("show"); forms[j].classList.add("hide"); }
                if (tasks[j]) { tasks[j].classList.remove("hide"); tasks[j].classList.add("show"); }
            }
            if (icons[i].getAttribute("clicked") == "false") {
                icons[i].innerText = "close";
                icons[i].setAttribute("clicked", "true");
                if (forms[i].classList.contains("hide")) {
                    forms[i].classList.add("show");
                    forms[i].classList.remove("hide");
                }
                if (tasks[i].classList.contains("show")) {
                    tasks[i].classList.add("hide");
                    tasks[i].classList.remove("show");
                }
            }
            else {
                icons[i].innerText = "edit";
                icons[i].setAttribute("clicked", "false");
                if (forms[i].classList.contains("show")) {
                    forms[i].classList.add("hide");
                    forms[i].classList.remove("show");
                }
                if (tasks[i].classList.contains("hide")) {
                    tasks[i].classList.add("show");
                    tasks[i].classList.remove("hide");
                }
            }

            setTimeout(() => {
                if (inputs[i]) {
                    inputs[i].focus();
                    inputs[i].setSelectionRange(inputs[i].value.length, inputs[i].value.length);
                }
            }, 20);
        });
    }


    const radios = Array.from(document.getElementsByClassName('deleteTask'));

    radios.forEach((r) => {
        r.addEventListener("click", () => {
            const id = r.dataset.taskId;
            const task = r.dataset.task;

            fetch('/deleteTask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, task })
            })
                .then((res) => {
                    if (res.ok) {
                        location.reload();
                    } else {
                        location.reload();
                    }
                })
                .catch(() => location.reload());
        });
    });


    document.getElementsByClassName("addNewTask")[0].addEventListener("click", () => {
        const addSection = document.getElementsByClassName("add-section")[0];
        addSection.style.display = "block";
        document.getElementsByClassName("newTask")[0].focus();
    });

    document.getElementById("newTaskClose").addEventListener("click", () => {
        const addSection = document.getElementsByClassName("add-section")[0];
        addSection.style.display = "none";
    });

    document.getElementsByClassName("profile-menu")[0].addEventListener("click", () => {
        document.getElementsByClassName("menu")[0].classList.remove("close");
        document.getElementsByClassName("menu")[0].classList.add("open");
       
    });

    document.getElementById("btn-profile-close").addEventListener("click", () => {
        document.getElementsByClassName("menu")[0].classList.add("close");
        document.getElementsByClassName("menu")[0].classList.remove("open");


    });
});

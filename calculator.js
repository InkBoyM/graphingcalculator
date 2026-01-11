$(document).ready(function() {
    let chart;
    
    // Load custom commands from LocalStorage
    let customCommands = JSON.parse(localStorage.getItem('customCmds')) || {};

    function updateCommandList() {
        $('#commandList').empty();
        for (let key in customCommands) {
            $('#commandList').append(`
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    y=${key} &rarr; ${customCommands[key]}
                    <button class="btn btn-danger btn-sm delete-cmd" data-key="${key}">Delete</button>
                </li>
            `);
        }
    }

    $('#calculatorForm').submit(function(e) {
        e.preventDefault();
        let rawInput = $('#equations').val().trim().toLowerCase();
        
        // --- 1. HANDLE SPECIAL COMMANDS ---
        
        // Command: y=calculator
        if (rawInput === 'y=calculator') {
            $('#cmdIframe').attr('src', '/calculator');
            $('#iframeOverlay').fadeIn();
            return;
        }

        // Command: y=settings
        if (rawInput === 'y=settings') {
            updateCommandList();
            $('#settingsModal').modal('show');
            return;
        }

        // Handle Custom Commands (y=yt, etc)
        if (rawInput.startsWith('y=')) {
            let key = rawInput.split('=')[1];
            if (customCommands[key]) {
                window.location.href = customCommands[key].startsWith('http') ? customCommands[key] : 'https://' + customCommands[key];
                return;
            }
        }

        // --- 2. HANDLE GRAPHING (IF NOT A COMMAND) ---
        let equations = $('#equations').val().split(','); 
        let minX = parseFloat($('#minX').val());
        let maxX = parseFloat($('#maxX').val());
        let selectedGraphType = $('#graphType').val();

        if (isNaN(minX) || isNaN(maxX) || minX >= maxX) {
            alert('Invalid range. Please check your input.');
            return;
        }

        let canvas = document.getElementById('graph').getContext('2d');
        let xValues = [];
        let datasets = [];

        // Pre-generate X values for the labels
        for (let x = minX; x <= maxX; x += 0.5) {
            xValues.push(x.toFixed(1));
        }

        for (let equation of equations) {
            equation = equation.trim();
            let yValues = [];

            try {
                for (let x = minX; x <= maxX; x += 0.5) {
                    let equationForEval = equation;
                    if(equationForEval.includes('=')) {
                        equationForEval = equationForEval.split('=')[1]; 
                    }
                    
                    equationForEval = equationForEval.replace(/(sin|cos|tan|sqrt|log|exp|pi|e)(?=\()|pi|e/g, 'Math.$&');
                    equationForEval = equationForEval.replace(/\^/g, '**');
                    
                    // Scope x for eval
                    let result = eval(equationForEval.replace(/x/g, `(${x})`));

                    if (!isNaN(result)) {
                        yValues.push(result);
                    } else {
                        throw new Error('Invalid');
                    }
                }

                datasets.push({
                    label: equation,
                    data: yValues,
                    borderColor: getRandomColor(),
                    borderWidth: 2,
                    fill: false
                });
            } catch (error) {
                console.error(error);
                alert(`Invalid equation: "${equation}".`);
                return;
            }
        }

        if (chart) chart.destroy();
        chart = new Chart(canvas, {
            type: selectedGraphType,
            data: { labels: xValues, datasets: datasets },
            options: { responsive: true, maintainAspectRatio: false }
        });
        $('.graphic-container').addClass('active');
    });

    // --- SETTINGS MODAL LOGIC ---
    $('#saveCmdBtn').click(function() {
        let key = $('#newCmdKey').val().trim().toLowerCase();
        let url = $('#newCmdUrl').val().trim();
        if (key && url) {
            customCommands[key] = url;
            localStorage.setItem('customCmds', JSON.stringify(customCommands));
            $('#newCmdKey', '#newCmdUrl').val('');
            updateCommandList();
        }
    });

    $(document).on('click', '.delete-cmd', function() {
        let key = $(this).data('key');
        delete customCommands[key];
        localStorage.setItem('customCmds', JSON.stringify(customCommands));
        updateCommandList();
    });

    // Close Iframe
    $('#closeIframe').click(function() {
        $('#iframeOverlay').fadeOut();
        $('#cmdIframe').attr('src', '');
    });

    $('#resetBtn').on('click', () => {
        if (chart) chart.destroy();
        $('.graphic-container').removeClass('active');
    });
});

function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}

// --- THEME LOGIC ---
document.body.style="background-color: var(--bs-dark);transition: 0.5s;"
const sun = "https://www.uplooder.net/img/image/55/7aa9993fc291bc170abea048589896cf/sun.svg";
const moon = "https://www.uplooder.net/img/image/2/addf703a24a12d030968858e0879b11e/moon.svg"

var theme = "dark";
const root = document.querySelector(":root");
const container = document.getElementsByClassName("theme-container")[0];
const themeIcon = document.getElementById("theme-icon");

container.addEventListener("click", setTheme);
function setTheme() {
    theme === "dark" ? setLight() : setDark();
}

function setLight() {
    root.style.setProperty("--bs-dark", "linear-gradient(318.32deg, #c3d1e4 0%, #dde7f3 55%, #d4e0ed 100%)");
    container.classList.replace("shadow-dark", "shadow-light");
    themeIcon.src = sun;
    theme = "light";
}

function setDark() {
    root.style.setProperty("--bs-dark", "#000");
    container.classList.replace("shadow-light", "shadow-dark");
    themeIcon.src = moon;
    theme = "dark";
}

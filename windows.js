// Запускаем и настраиваем tsParticles для анимированного фона
tsParticles.load("particles-js", {
    fpsLimit: 60,
    particles: {
        number: {
            value: 60,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: ["#38c8d1", "#5b79f2", "#ffffff"]
        },
        shape: {
            type: "circle"
        },
        opacity: {
            value: 0.5,
            random: true,
        },
        size: {
            value: 3,
            random: true,
        },
        links: {
            enable: true,
            distance: 150,
            color: "#888",
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
        }
    },
    interactivity: {
        detect_on: "window",
        events: {
            onhover: {
                enable: true,
                mode: "repulse"
            },
            onclick: {
                enable: true,
                mode: "push"
            },
            resize: true
        },
        modes: {
            repulse: {
                distance: 100,
                duration: 0.4,
                selectors: ".hero-animation-wrapper" 
            },
            push: {
                particles_nb: 4
            }
        }
    },
    detectRetina: true
});


// Инициализация библиотеки Animate On Scroll (AOS)
AOS.init({
    duration: 800,
    once: true,    
    offset: 50,
});
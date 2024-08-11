const input = document.getElementById("upload");
const scale = document.getElementById("range_slider");
const canvas = document.getElementById("show");
const submit = document.getElementById("submit");

input.onchange = (e) => {
    var target = e.target;
    var files = target.files;

    if(FileReader && files && files.length) {
        var img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                const ctx = canvas.getContext("2d");
                canvas.height = img.naturalHeight;
                canvas.width = img.naturalWidth;
                const aspectHeight = img.naturalHeight / canvas.clientHeight;
                const aspectWidth = img.naturalWidth / canvas.clientWidth;
                const scaledHeight = canvas.clientHeight * aspectHeight;
                const scaledWidth = canvas.clientWidth * aspectWidth;
                ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
                scale.min = 1;
                scale.max = scaledWidth / 2;

                var mousePos = { x: scaledWidth / 2, y: scaledHeight / 2 };
                var area = scaledWidth / 4;
                var isTracking = false;

                function render() {
                    mousePos.x = Math.max(area, Math.min(scaledWidth - area, mousePos.x));
                    mousePos.y = Math.max(area, Math.min(scaledHeight - area, mousePos.y));
                    ctx.reset();
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    ctx.beginPath();
                    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                    ctx.rect(mousePos.x - area, mousePos.y - area, area * 2, area * 2);
                    ctx.fill();
                    ctx.stroke();
                }

                scale.oninput = () => {
                    area = parseInt(scale.value);
                    render();
                }

                function startTracking(e) {
                    isTracking = true;
                    updateMousePosition(e);
                    render();
                }

                function stopTracking() {
                    isTracking = false;
                }

                function handleMove(e) {
                    if (!isTracking) return;
                    e.preventDefault();
                    updateMousePosition(e);
                    render();
                }

                function updateMousePosition(e) {
                    const rect = canvas.getBoundingClientRect();
                    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                    mousePos.x = (clientX - rect.left) * aspectWidth;
                    mousePos.y = (clientY - rect.top) * aspectHeight;
                }

                canvas.addEventListener("mousedown", (e) => {
                    if (e.button === 0) startTracking(e);
                });
                canvas.addEventListener("touchstart", startTracking);
                canvas.addEventListener("mouseup", stopTracking);
                canvas.addEventListener("touchend", stopTracking);
                canvas.addEventListener("mouseleave", stopTracking);
                canvas.addEventListener("mousemove", handleMove);
                canvas.addEventListener("touchmove", handleMove);

                render();

                submit.onclick = () => {
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = area * 2;
                    tempCanvas.height = area * 2;
                    const tempCtx = tempCanvas.getContext("2d");
                    
                    tempCtx.drawImage(img, 
                        mousePos.x - area, mousePos.y - area, area * 2, area * 2,
                        0, 0, area * 2, area * 2
                    );
                    
                    canvas.width = area * 2;
                    canvas.height = area * 2;
                    ctx.drawImage(tempCanvas, 0, 0);

                    const cookie = localStorage.getItem("cookie");
                    if (!cookie) return;
                    fetch("/avatar-upload", {
                        method: "POST",
                        headers: {
                            'Authorization': cookie,
                        },
                        body: canvas.toDataURL()
                    }).then(response => {
                        if (response.ok) return window.location.replace("/");
                    });
                }
            }
            img.src = e.target.result;
        };
        reader.readAsDataURL(files[0]);
    }
}
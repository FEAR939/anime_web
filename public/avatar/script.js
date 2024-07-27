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
            img.src = e.target.result;
            
            img.onload = () => {
                const ctx = canvas.getContext("2d");
                canvas.height = canvas.clientHeight;
                canvas.width = canvas.clientWidth;
                const aspect = img.height / img.width;
                ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight * aspect);
                scale.min = 1;
                scale.max = canvas.width;

                function render() {
                    ctx.reset();
                    ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight * aspect);
                    ctx.beginPath();
                    ctx.fillStyle = "rgba(255, 255, 255, 0.3";
                    ctx.moveTo((canvas.width / 2) - (scale.value / 2), (canvas.height / 2) - (scale.value / 2));
                    ctx.lineTo((canvas.width / 2) + (scale.value / 2), (canvas.height / 2) - (scale.value / 2));
                    ctx.lineTo((canvas.width / 2) + (scale.value / 2), (canvas.height / 2) + (scale.value / 2));
                    ctx.lineTo((canvas.width / 2) - (scale.value / 2), (canvas.height / 2) + (scale.value / 2));
                    ctx.lineTo((canvas.width / 2) - (scale.value / 2), (canvas.height / 2) - (scale.value / 2));

                    ctx.fill();
                    ctx.stroke();
                }

                scale.onchange = () => {
                    render();
                }
                render();

                submit.onclick = () => {
                    const offset = (canvas.width / 2) - (scale.value / 2);
                    ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight * aspect);
                    const imagedata = ctx.getImageData(offset, offset, scale.value, scale.value);
                    ctx.reset();
                    ctx.putImageData(imagedata, 0, 0, 0, 0, imagedata.width, imagedata.height);

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
                    })
                }
            }
        };
        reader.readAsDataURL(files[0]);
    }
}
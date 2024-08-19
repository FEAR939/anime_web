const plot = document.body.querySelector(".plot");
const ctx = plot.getContext("2d");

const amountOfValues = 60;
const plotPadding = 2;

plot.height = 400;
plot.width = 1200;
const numberPadding = 30;
const Widthsteps = (plot.width - numberPadding) / amountOfValues;

// if (points.length != amountOfValues) {
//     for (var i = 0; i < amountOfValues - points.length; i++) {
//         points.push({ count: 0 });
//     }
// }

function renderPlot(points) {
    ctx.reset();
    ctx.strokeStyle = "rgb(40, 40, 40)";
    for (var i = 0; i < plot.width / Widthsteps; i++) {
        ctx.beginPath();
        ctx.moveTo((i * Widthsteps) + numberPadding, numberPadding);
        ctx.lineTo((i * Widthsteps) + numberPadding, plot.height - numberPadding);
        ctx.closePath();
        
        ctx.stroke();
    }

    const maxValue =  Math.max(...points.map(point => point.value)) + plotPadding;
    const Heightsteps = (plot.height - (numberPadding * 2)) / maxValue;

    ctx.font = "12px system-ui";
    ctx.fillStyle = "rgb(200, 200, 200)";
    const numbersCount = Math.floor((plot.height - (2 * numberPadding)) / (12 + numberPadding));
    
    for (var i = 0; i < maxValue; i++) {
        if (i % numbersCount !== 0) continue;
        ctx.fillText(i, 0, (plot.height - numberPadding + 6) - (i * Heightsteps));
    }

    ctx.strokeStyle = "rgb(126, 89, 223)";
    for (var i = 0; i < points.length; i++) {
        ctx.fillStyle = ctx.fillStyle = "rgb(200, 200, 200)";
        ctx.fillText(points[i].timestamp, (i * Widthsteps) + numberPadding - 6, plot.height - 12);
        ctx.fillStyle = "rgb(126, 89, 223)";
        ctx.beginPath();
        ctx.arc((i * Widthsteps) + numberPadding, (plot.height - numberPadding) - (points[i].value * Heightsteps), 4, 0, 2 * Math.PI);
        ctx.fill();
        if (i !== points.length - 1) {
            ctx.lineWidth = 2;
            ctx.moveTo((i * Widthsteps) + numberPadding, (plot.height - numberPadding) - (points[i].value * Heightsteps));
            ctx.lineTo(((i + 1) * Widthsteps) + numberPadding, (plot.height - numberPadding) - (points[i + 1].value * Heightsteps));
        }
        ctx.closePath();
        ctx.stroke();
    }
}

function getUtil() {
    fetch("/dashboard/getHour").then(res => res.json()).then(result => {
        renderPlot(result);
    });
    setTimeout(getUtil, 5000);
}

getUtil();
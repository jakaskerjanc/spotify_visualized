let monthSlider
let months
let selectedMonth = '2018-12'

let w
let h

let graphXMargin
let graphYMargin
let graphWidth
let graphHeight
let barWidth
let graphTopEdge
const sliderMargin = 90

let top5Artists, artistColors

recalcDimensions()

let cumulativeListeningData

let canvas

function preload() {
    cumulativeListeningData = loadJSON('data/cumulativeListeningTime.json')
}

function setup() {
    top5Artists = calculateTop5Artists()
    artistColors = getUniqueColorForEachArtists()

    canvas = createCanvas(w, h)

    sliderSetup()

    dataContainer = d3.select('body').append('custom');
    refresh();
    setInterval(refresh, 1000);
    setInterval(incrementSelectedMonth, 1000);
    d3.timer(drawFunction);
}

function incrementSelectedMonth() {
    const monthIndex = months.indexOf(selectedMonth)
    const nextMonthIndex = (monthIndex + 1) % months.length
    selectedMonth = months[nextMonthIndex]
    monthSlider.value(nextMonthIndex)
}

function getUniqueColorForEachArtists() {
    const allArtists = new Set()

    // Use top5Artists to get all artists
    for (const month in top5Artists) {
        top5Artists[month].forEach(([artist, minutes]) => allArtists.add(artist))
    }

    let shuffledArtists = Array.from(allArtists)
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)

    // Map each artist to a unique color

    const colors = {}
    const hueStep = 360 / allArtists.size
    let hue = 0

    shuffledArtists.forEach(artist => {
        colors[artist] = `hsl(${Math.round(hue)}, 50%, 50%)`
        hue += hueStep
    })

    return colors
}

function refresh() {
    var values, maxValue;
    values = top5Artists[selectedMonth].map(([artist, minutes]) => minutes)
    maxValue = Math.max(...values)

    x = d3.scaleLinear([0, 5], [graphXMargin, graphWidth + graphXMargin])
    y = d3.scaleLinear([0, maxValue + 50], [graphHeight + graphYMargin, graphTopEdge])

    //bind generated data to custom dom elements
    var bars = dataContainer.selectAll('.bars').data(values);

    //store variables for visual representation. These will be used
    //later by p5 methods.
    bars
        .enter()
        .append('rect')
        .attr('height', 0)
        .attr('class', 'bars')
        .attr('x', function (d, i) { return x(i) })
        .attr('dx', graphWidth / 5)
        .attr('y', function (d) { return graphHeight; })
        .attr('value', function (d) { return d; })
        .attr('artist', function (d, i) { return top5Artists[selectedMonth][i][0]; })

    bars
        .transition()
        .duration(1000)
        .delay(function (d, i) { return i * 50; })
        .attr('height', function (d) { return graphHeight - y(d); })
        .attr('x', function (d, i) { return x(i) })
        .attr('y', function (d) { return y(d); })
        .attr('dx', graphWidth / 5)
        .attr('value', function (d) { return d; })
        .attr('artist', function (d, i) { return top5Artists[selectedMonth][i][0]; })
}

function recalcDimensions() {
    w = window.innerWidth
    h = window.innerHeight

    graphXMargin = w * 0.1
    graphYMargin = h * 0.1
    graphWidth = w - (graphXMargin * 2)
    graphHeight = h - (graphYMargin * 2)
    barWidth = graphWidth / 5
    graphTopEdge = sliderMargin
}

function resizeSlider() {
    monthSlider.position(graphXMargin, 20)
    monthSlider.size(graphWidth)
}

function sliderSetup() {
    months = Object.keys(cumulativeListeningData).sort()

    monthSlider = createSlider(0, months.length - 1, 0, 1)
    resizeSlider()

    monthSlider.changed(() => {
        selectedMonth = months[monthSlider.value()]
    })
}

function windowResized() {
    recalcDimensions()
    resizeCanvas(w, h)
    resizeSlider()
}

function drawMonthText() {
    const date = new Date(selectedMonth)
    const monthName = date.toLocaleString('sl', { month: 'long' });
    const year = date.getFullYear()

    const monthText = monthName + ' ' + year

    textAlign(CENTER)
    textSize(14)
    fill(0)
    text(monthText, w / 2, 50)
}

// function drawFunction() {
//     background(255)

//     const monthIndex = monthSlider.value()
//     const selectedMonth = months[monthIndex]

//     drawMonthText(selectedMonth)
//     drawGraph(selectedMonth)
// }

function drawFunction() {
    background(255);
    drawMonthText(selectedMonth)
    noStroke();

    //p5.dom
    var barsHTML = document.getElementsByClassName('bars');
    var bars = Array.from(barsHTML).map(bar => new p5.Element(bar));

    for (var i = 0; i < bars.length; i++) {
        var thisbar = bars[i];
        push();
        translate(thisbar.attribute('x'), thisbar.attribute('y'));

        // if ((mouseX > thisbar.attribute('x')) && (mouseX < (int(thisbar.attribute('x')) + int(thisbar.attribute('dx'))))) {
        //     fill('brown');
        // } else {
        //     fill('red');
        // }
        fill(color(artistColors[thisbar.attribute('artist')]));
        rect(1, 1, thisbar.attribute('dx'), thisbar.attribute('height'));
        fill('white')
        text(int(thisbar.attribute('value')), thisbar.attribute('dx') / 2 + 2, 15);
        text(thisbar.attribute('artist'), thisbar.attribute('dx') / 2 + 2, thisbar.attribute('height') - 10);
        pop();
    }
    stroke('black');
    strokeWeight(3);
    line(0, height, width, height);
    noStroke();
}

function drawGraph(month) {
    stroke(0)
    line(graphXMargin, graphHeight + graphYMargin, graphWidth + graphXMargin, graphHeight + graphYMargin) // x axis
    line(graphXMargin, graphTopEdge, graphXMargin, graphHeight + graphYMargin) // y axis

    // // Add artist names below bars
    // textAlign(CENTER)
    // textSize(12)
    // fill(0)
    // top5Artists.forEach(([artist, minutes], index) => {
    //     const x = graphMargin + (index * barWidth) + barWidth / 2
    //     const y = height - graphMargin + 20
    //     text(artist, x, y)
    // })

    // // Add minutes above bars
    // textAlign(CENTER)
    // textSize(12)
    // fill(0)
    // top5Artists.forEach(([artist, minutes], index) => {
    //     const x = graphMargin + (index * barWidth) + barWidth / 2
    //     const y = height - graphMargin - (minutes / maxMinutes) * graphHeight - 10
    //     text(minutes + ' min', x, y)   
    // })
}

// Calculate top 5 artists for every month from cumulative data
function calculateTop5Artists() {
    const top5Artists = {}

    for (const month in cumulativeListeningData) {
        const monthData = cumulativeListeningData[month]
        const sortedArtists = Object.entries(monthData)
            .sort(([, a], [, b]) => b - a)

        top5Artists[month] = sortedArtists.slice(0, 5)
    }

    // convert milliseconds to minutes
    for (const month in top5Artists) {
        top5Artists[month] = top5Artists[month].map(([artist, ms]) => [artist, Math.round(ms / 60000)])
    }

    return top5Artists
}


let monthSlider, button
let months
let selectedMonth = '2018-12'
let isAutoplayOn = true

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
    buttonSetup()

    dataContainer = d3.select('body').append('custom');
    refresh();
    setInterval(refresh, 1000);
    setInterval(incrementSelectedMonth, 1000);
    d3.timer(drawFunction);
}

function incrementSelectedMonth() {
    if (!isAutoplayOn) {
        return
    }
    const monthIndex = months.indexOf(selectedMonth)
    const nextMonthIndex = (monthIndex + 1) % months.length
    selectedMonth = months[nextMonthIndex]
    monthSlider.value(nextMonthIndex)
}

function getUniqueColorForEachArtists() {
    const allArtists = new Set()

    for (const month in top5Artists) {
        top5Artists[month].forEach(([artist, minutes]) => allArtists.add(artist))
    }

    let shuffledArtists = Array.from(allArtists)
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)

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
    artists = top5Artists[selectedMonth].map(([artist, minutes]) => artist)
    maxValue = Math.max(...values)

    x = d3.scaleBand()
        .domain(artists)
        .range([graphXMargin, graphWidth + graphXMargin])
        .padding(0.1)

    y = d3.scaleLinear()
        .domain([0, maxValue + 50])
        .range([graphHeight + graphYMargin, graphTopEdge]);

    var bars = dataContainer.selectAll('.bars').data(values);

    bars
        .enter()
        .append('rect')
        .attr('height', 0)
        .attr('class', 'bars')
        .attr('x', function (d, i) { return x(top5Artists[selectedMonth][i][0]) })
        .attr('dx', x.bandwidth())
        .attr('y', function (d) { return graphHeight; })
        .attr('value', function (d) { return d; })
        .attr('artist', function (d, i) { return top5Artists[selectedMonth][i][0]; })

    bars
        .transition()
        .duration(1000)
        .delay(function (d, i) { return i * 50; })
        .attr('height', function (d) { return graphHeight - y(d); })
        .attr('x', function (d, i) { return x(top5Artists[selectedMonth][i][0]) })
        .attr('y', function (d) { return y(d); })
        .attr('dx', x.bandwidth())
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
    monthSlider.size(graphWidth - 70)
}

function resizeButton() {
    button.position(graphWidth + graphXMargin - 50, 20)
}

function sliderSetup() {
    months = Object.keys(cumulativeListeningData).sort()

    monthSlider = createSlider(0, months.length - 1, 0, 1)
    resizeSlider()

    monthSlider.changed(() => {
        selectedMonth = months[monthSlider.value()]
    })
    monthSlider.mouseClicked(() => {
        isAutoplayOn = false
    })
}

function buttonSetup() {
    button = createButton('⏯️')
    resizeButton()
    button.mousePressed(() => isAutoplayOn = !isAutoplayOn)
}

function windowResized() {
    recalcDimensions()
    resizeCanvas(w, h)
    resizeSlider()
    resizeButton()
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

function drawFunction() {
    background(255);
    drawMonthText(selectedMonth)
    noStroke();

    var barsHTML = document.getElementsByClassName('bars');
    var bars = Array.from(barsHTML).map(bar => new p5.Element(bar));

    for (var i = 0; i < bars.length; i++) {
        var thisbar = bars[i];
        push();
        translate(thisbar.attribute('x'), thisbar.attribute('y'));
        fill(color('#1DB954'));
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

function calculateTop5Artists() {
    const top5Artists = {}

    for (const month in cumulativeListeningData) {
        const monthData = cumulativeListeningData[month]
        const sortedArtists = Object.entries(monthData)
            .sort(([, a], [, b]) => b - a)

        top5Artists[month] = sortedArtists.slice(0, 5)
    }

    for (const month in top5Artists) {
        top5Artists[month] = top5Artists[month].map(([artist, ms]) => [artist, Math.round(ms / 60000)])
    }

    return top5Artists
}


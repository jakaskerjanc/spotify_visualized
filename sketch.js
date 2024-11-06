const data = _.flatten(Object.entries(cumulativeListeningTime).map(([date, artistMinuteMap]) => {
    return Object.entries(artistMinuteMap).map(([artist, minutes]) => { return { date, name: artist, value: Math.round(minutes / 60000) } })
}))

const names = new Set(data.map(d => d.name))

const scale = d3.scaleOrdinal(d3.schemeTableau10);

const n = 12
const k = 10
const duration = 200
const barSize = 48
const marginTop = 16
const marginRight = 6
const marginBottom = 6
const marginLeft = 0
const height = marginTop + barSize * n + marginBottom
const width = 960

const x = d3.scaleLinear([0, 1], [marginLeft, width - marginRight])

const y = d3.scaleBand()
    .domain(d3.range(n + 1))
    .rangeRound([marginTop, marginTop + barSize * (n + 1 + 0.1)])
    .padding(0.1)

const tickFormat = undefined

const formatDate = d3.utcFormat("%M %Y")

d3.select('body').append('svg');
const svg = d3.select("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

const datevalues = Array.from(d3.rollup(data, ([d]) => d.value, d => d.date, d => d.name))
    .map(([date, data]) => [new Date(date), data])
    .sort(([a], [b]) => d3.ascending(a, b))

const keyframes = [];
let ka, a, kb, b;
for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
    for (let i = 0; i < k; ++i) {
        const t = i / k;
        keyframes.push([
            new Date(ka * (1 - t) + kb * t),
            rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
        ]);
    }
}
keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);

const allPossibleDates = keyframes.map(([date]) => date)

const nameframes = d3.groups(keyframes.flatMap(([, data]) => data), d => d.name)
const prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])))
const next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)))

const updateBars = bars(svg);
const updateAxis = axis(svg);
const updateLabels = labels(svg);

const node = svg.node();

const formatNumber = d3.format(",d")

let currentKeyframeIndex = 0
let stoppedKeyframeIndex
let isAutoplayOn = true

async function render() {
    while (currentKeyframeIndex < keyframes.length && isAutoplayOn) {
        const keyframe = keyframes[currentKeyframeIndex]
        await animate(keyframe)
        currentKeyframeIndex++
    }
}

async function animate(keyframe) {
    const transition = svg.transition()
        .duration(duration)
        .ease(d3.easeLinear);

    x.domain([0, keyframe[1][0].value]);

    updateAxis(keyframe, transition);
    updateBars(keyframe, transition);
    updateLabels(keyframe, transition);
    // updateTicker(keyframe, transition);

    // invalidation.then(() => svg.interrupt());
    await transition.end();
}

function showChartForDate(date) {
    const keyframeIndex = keyframes.findIndex(([keyframeDate]) => keyframeDate.getTime() === date.getTime())
    if (keyframeIndex === -1) {
        console.error(`No data for date ${date}`)
        return
    }
    currentKeyframeIndex = keyframeIndex
    animate(keyframes[currentKeyframeIndex])
}

function stopAnimation() {
    stoppedKeyframeIndex = currentKeyframeIndex
    isAutoplayOn = false
}

function startAnimation() {
    currentKeyframeIndex = stoppedKeyframeIndex
    isAutoplayOn = true
    render()
}

function toggleAutoplay() {
    if (isAutoplayOn) {
        stopAnimation()
    } else {
        startAnimation()
    }
}

render()

function bars(svg) {
    let bar = svg.append("g")
        .attr("fill-opacity", 0.6)
        .selectAll("rect");

    return ([date, data], transition) => bar = bar
        .data(data.slice(0, n), d => d.name)
        .join(
            enter => enter.append("rect")
                .attr("fill", d => scale(d.name))
                .attr("height", y.bandwidth())
                .attr("x", x(0))
                .attr("y", d => y((prev.get(d) || d).rank))
                .attr("width", d => x((prev.get(d) || d).value) - x(0)),
            update => update,
            exit => exit.transition(transition).remove()
                .attr("y", d => y((next.get(d) || d).rank))
                .attr("width", d => x((next.get(d) || d).value) - x(0))
        )
        .call(bar => bar.transition(transition)
            .attr("y", d => y(d.rank))
            .attr("width", d => x(d.value) - x(0)));
}

function labels(svg) {
    let label = svg.append("g")
        .style("font", "bold 12px var(--sans-serif)")
        .style("font-variant-numeric", "tabular-nums")
        .attr("text-anchor", "end")
        .selectAll("text");

    return ([date, data], transition) => label = label
        .data(data.slice(0, n), d => d.name)
        .join(
            enter => enter.append("text")
                .attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
                .attr("y", y.bandwidth() / 2)
                .attr("x", -6)
                .attr("dy", "-0.25em")
                .text(d => d.name)
                .call(text => text.append("tspan")
                    .attr("fill-opacity", 0.7)
                    .attr("font-weight", "normal")
                    .attr("x", -6)
                    .attr("dy", "1.15em")),
            update => update,
            exit => exit.transition(transition).remove()
                .attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
                .call(g => g.select("tspan").tween("text", d => textTween(d.value, (next.get(d) || d).value)))
        )
        .call(bar => bar.transition(transition)
            .attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
            .call(g => g.select("tspan").tween("text", d => textTween((prev.get(d) || d).value, d.value))));
}

function textTween(a, b) {
    const i = d3.interpolateNumber(a, b);
    return function (t) {
        this.textContent = formatNumber(i(t));
    };
}

function axis(svg) {
    const g = svg.append("g")
        .attr("transform", `translate(0,${marginTop})`);

    const axis = d3.axisTop(x)
        .ticks(width / 160, tickFormat)
        .tickSizeOuter(0)
        .tickSizeInner(-barSize * (n + y.padding()));

    return (_, transition) => {
        g.transition(transition).call(axis);
        g.select(".tick:first-of-type text").remove();
        g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
        g.select(".domain").remove();
    };
}

function rank(value) {
    const data = Array.from(names, name => ({ name, value: value(name) }));
    data.sort((a, b) => d3.descending(a.value, b.value));
    for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
    return data;
}

let slider, button

function setup() {
    const myCanvas = document.getElementById('myCanvas');
    createCanvas(800, 80, myCanvas);

    button = createButton('⏯️');
    button.position(20, 18);
    button.mousePressed(toggleAutoplay)

    slider = createSlider(0, allPossibleDates.length - 1, 0, 1);
    slider.input(() => {
        showChartForDate(allPossibleDates[slider.value()])
        stopAnimation()
    })
    slider.position(70, 20);
    slider.size(500);
}

function draw() {
    background(255);

    drawDateText(allPossibleDates[currentKeyframeIndex])
}

function drawDateText(date) {
    const formattedDate = date.toLocaleString('sl', { month: 'long', year: 'numeric' })
    textSize(14)
    fill(0)
    text(formattedDate, 600, 35)

    slider.value(currentKeyframeIndex)
}
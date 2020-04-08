// Load data.
d3.json('data/chartData.json').then(result => {
    ready(result);
});

const MEASUREMENT_INTERVAL = 600000;

const svg = d3
    .select('.combo-chart-container')
    .append('svg');

// Main function.
function ready(data) {
    const chartData = filterData(data);
    const config = {
        name: chartData.fullName,
        unit: chartData.unit,
        color: chartData.color,
        dateFormat: d3.timeFormat("%Y-%m-%d %H:%M %p")
    };

    const values = chartData.values;
    const area = baseDimension();

    //Scales
    const extent = d3.extent(values, value => value.x);
    const xScale = d3
        .scaleTime()
        .domain(extent)
        .range([0, area.width]);

    const yMax = d3.max(values, value => value.y);
    const yScale = d3
        .scaleLinear()
        .domain([0, yMax])
        .range([area.height, 0]);

    const lineGenerator = d3
        .line()
        .defined(d => d.y !== null)
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    const filteredData = values.filter(lineGenerator.defined());

    const axisX = d3
        .axisBottom(xScale)
        .tickFormat(config.dateFormat)
        .tickSizeOuter(0);

    const axisY = d3
        .axisLeft(yScale)
        .ticks(5)
        .tickSizeOuter(0)
        .tickSizeInner(-area.width);

    drawArea(area);
    drawAxis(area, axisX, axisY);
    drawLines(area, values, filteredData, lineGenerator, config)
}

function filterData(rData) {
    const values = [];
    const data = rData[1];

    const mapped = data.values.map(d => {
        return {
            x: new Date(d.x),
            y: d.y
        }
    });

    mapped.reduce((prev, curr, i) => {
        const prevDate = new Date(prev.x);
        const currDate = new Date(curr.x);
        (currDate - prevDate) <= MEASUREMENT_INTERVAL ?
            values.push({x: currDate, y: curr.y}) :
            values.push({x: new Date(currDate.getTime() + 1000), y: null});
        return curr;
    });

    return {
        key:data.key,
        fullName:data.fullName,
        unit:data.unit,
        order:+data.order,
        color:data.color,
        values:values
    };
}

function baseDimension() {
    const margin = {top: 40, right: 40, bottom: 150, left: 60};
    const width = 500 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    return {
        margin: margin,
        width: width,
        height: height
    }
}

function drawArea(area) {
    svg
        .attr('width', area.width + area.margin.left + area.margin.right)
        .attr('height', area.height + area.margin.top + area.margin.bottom)
        .attr('transform', `translate(${area.margin.left}, ${area.margin.top})`);
}

function drawAxis(area, axisX, axisY) {
    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left}, ${area.height + area.margin.top})`)
        .attr('class', 'x axis')
        .call(axisX)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -105)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "start");

    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left}, ${area.margin.top})`)
        .attr('class', 'y axis')
        .call(axisY);
}

function drawLines(area, values, filteredData, lineGenerator, config) {
    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left}, ${area.margin.top})`)
        .data([filteredData])
        .append('path')
        .attr('stroke-dasharray', '4')
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .attr('stroke', config.color);

    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left}, ${area.margin.top})`)
        .data([values])
        .append('path')
        .attr('class', 'line')
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .style('stroke', config.color);
}

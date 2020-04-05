// Load data.
d3.json('data/chartData.json').then(result => {
    ready(result);
});

const svg = d3
    .select('.bar-chart-container')
    .append('svg');

// Main function.
function ready(data) {
    const chartData = filterData(data);
    const config = {
        name: chartData.fullName,
        unit: chartData.unit,
        color: chartData.color
    };

    const values = chartData.values;
    const area = baseDimension();

    //Scales
    const xScale = d3
            .scaleBand()
            .domain(values.map(obj => obj.x))
            .range([0, area.width])
            .paddingInner([0.1])
            .paddingOuter([0.3])
            .align([0.5]);

    const yMax = d3.max(values, value => value.y);
    const yScale = d3
        .scaleLinear()
        .domain([0, yMax])
        .range([area.height, 0]);

    var axis = d3.axisBottom(xScale)
        .tickSizeInner(4)
        .tickSizeOuter(20)
        .tickPadding(3);

    drawArea(area);
    drawAxis(axis, area);
    drawBars(values, xScale, yScale, area, config);
}

function filterData(data) {
    return data[0];
}

function baseDimension() {
    const margin = {top: 20, right: 10, bottom: 40, left: 10};
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const axisHeight = 30;

    return {
        margin: margin,
        width: width,
        height: height,
        axisHeight: axisHeight
    }
}

function drawArea(area) {
    svg
        .attr('width', area.width + area.margin.left + area.margin.right)
        .attr('height', area.height + area.margin.top + area.margin.bottom)
        .append('g')
        .attr('transform', `translate(${area.margin.left}, ${area.margin.top})`);
}

function drawBars(chartData, xScale, yScale, area, config) {
     svg
        .selectAll('.bar')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('width', xScale.bandwidth())
        .attr('height', value => yScale(value.y))
        .attr('x', value => xScale(value.x))
        .attr('y', value => area.height - yScale(value.y))
        .style('fill', config.color);
}

function drawAxis(axis, area) {
    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left}, ${area.height})`)
        .call(axis)
}





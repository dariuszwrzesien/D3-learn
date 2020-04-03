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
    const yMax = d3.max(values, value => value.y);
    const yScale = d3
        .scaleLinear()
        .domain([0, yMax])
        .range([0, area.width])

    const xMax = d3.extent(values, date => new Date(date.x))
    const xScale = d3
        .scaleLinear()
        .domain(xMax)
        .range([0, area.height])


    drawBase(area);
    drawBars(values, xScale, yScale, config);
}

function filterData(data) {
    return data[0];
}

function baseDimension() {
    const margin = {top: 40, right: 40, bottom: 40, left: 40};
    const width = 400 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    return {
        margin: margin,
        width: width,
        height: height
    }
}

function drawBase(area) {
    svg
        .attr('width', area.width + area.margin.left + area.margin.right)
        .attr('height', area.height + area.margin.top + area.margin.bottom)
        .append('g')
        .attr('transform', `translate(${area.margin.left}, ${area.margin.top})`);
}

function drawBars(chartData, xScale, yScale, config) {
    const bars = svg
        .selectAll('.bar')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', value => yScale(value.y))
        .attr('width', 20)
        .attr('height', value => yScale(value.y))
        .style('fill', config.color)
}



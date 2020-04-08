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
        color: chartData.color,
        dateFormat: d3.timeFormat("%Y-%m-%d %H:%M %p")
    };

    const values = chartData.values;
    const area = baseDimension();

    //Scales
    const xDomain = values.map(obj => obj.x);
    const xScale = d3
        .scaleBand()
        .domain(xDomain)
        .range([0, area.width])
        .paddingInner([0.1])
        .paddingOuter([0.3])
        .align([0.5]);

    const yMax = d3.max(values, value => value.y);
    const yMin = d3.min(values, value => value.y);
    const yScale = d3
        .scaleLinear()
        .domain([0, yMax])
        .range([area.height,  0]);

    const axisX = d3.axisBottom(xScale)
        .tickFormat(d => config.dateFormat(new Date(d)))
        .tickPadding(0.1);
    const axisY = d3.axisLeft(yScale)
        .tickPadding(0.1);

    drawArea(area);
    drawHeader(area);
    drawAxis(axisX, axisY, area);
    drawBars(values, xScale, yScale, area, config);
    addListeners();
}

function filterData(data) {
    return data[0];
}

function baseDimension() {
    const margin = {top: 120, right: 60, bottom: 90, left: 70};
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
        .attr('transform', `translate(${area.margin.left}, ${area.margin.top})`)
}

function drawHeader(area) {
    const header = svg
        .append('g')
        .attr('class', 'chart-header')
        .attr('transform', `translate(${(area.width + area.margin.left)/2}, ${area.margin.top/2})`)
        .append('text');

    header.append('tspan').text('Bar chart');
}

function drawAxis(axisX, axisY, area) {
    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left}, ${area.height + 60})`)
        .call(axisX)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -105)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "start");

    svg
        .append("g")
        .attr('transform', `translate(${area.margin.left}, 60)`)
        .call(axisY)
        .append("text")
}

function drawBars(chartData, xScale, yScale, area, config) {
    svg
        .append("g")
        .attr('transform', `translate(${area.margin.left}, 60)`)
        .selectAll('.bar')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('width', xScale.bandwidth())
        .attr('height', value => yScale(0) - yScale(value.y))
        .attr('x', value => xScale(value.x))
        .attr('y', value => yScale(value.y))
        .style('fill', config.color);
}

function addListeners() {
    d3.selectAll('.bar').on('mouseover', mouseover);
    d3.selectAll('.bar').on('mousemove', mousemove);
    d3.selectAll('.bar').on('mouseout', mouseout);


    function mouseover() {
        const data = d3.select(this).data()[0];
        d3.select('.tooltip')
            .style('left', `${d3.event.clientX + 15}px`)
            .style('top', `${d3.event.clientY}px`)
            .style('opacity', 0.98);

        d3.select('.tooltip').select('.tip-body').html(`y: ${data.y}`);
    }

    function mousemove() {
        d3.select('.tooltip')
            .style('left', `${d3.event.clientX + 15}px`)
            .style('top', `${d3.event.clientY}px`)
    }

    function mouseout() {
        d3.select('.tooltip')
            .style('opacity', 0);
    }
}

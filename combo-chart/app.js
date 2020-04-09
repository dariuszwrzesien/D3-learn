// Load data.
d3.json('data/chartData.json').then(result => {
    ready(result);
});

let barChartConfig;
let lineChartConfig;

const MEASUREMENT_INTERVAL = 600000;
const svg = d3
    .select('.combo-chart-container')
    .append('svg');

// Main function.
function ready(data) {
    const chartData = filterData(data);

    barChartConfig = {
        name: chartData.barChart.fullName,
        unit: chartData.barChart.unit,
        color: chartData.barChart.color,
        dateFormat: d3.timeFormat("%Y-%m-%d %H:%M %p")
    };

    lineChartConfig = {
        name: chartData.lineChart.fullName,
        unit: chartData.lineChart.unit,
        color: chartData.lineChart.color,
        dateFormat: d3.timeFormat("%Y-%m-%d %H:%M %p")
    };

    const barChartValues = chartData.barChart.values;
    const lineChartValues = chartData.lineChart.values;
    const area = baseDimension();

    //Scales
    //Bar
    const xBarScale = d3.scaleBand()
        .domain(barChartValues.map(d => d.x))
        .range([0, area.width])
        .paddingInner(0.1)
        .paddingOuter(0.1);

    const yBarScale = d3.scaleLinear()
        .domain([0, d3.max(barChartValues, d => d.y)]).nice()
        .range([area.height, 0]);

    const axisXBar = d3.axisBottom(xBarScale)
        .tickFormat(d => barChartConfig.dateFormat(new Date(d)))
        .tickPadding(0.1);
    const axisYBar = d3.axisRight(yBarScale)
        .tickPadding(0.1);
    //end of Bar

    //Line
    const extent = d3.extent(lineChartValues, value => value.x);
    const xLineScale = d3
        .scaleTime()
        .domain(extent)
        .range([0, area.width]);

    const yLineMax = d3.max(lineChartValues, value => value.y);
    const yLineScale = d3
        .scaleLinear()
        .domain([0, yLineMax])
        .range([area.height, 0]);

    const lineGenerator = d3
        .line()
        .defined(d => d.y !== null)
        .x(d => xLineScale(d.x))
        .y(d => yLineScale(d.y));

    const filteredData = lineChartValues.filter(lineGenerator.defined());

    const axisXLine = d3.axisBottom(xLineScale)
        .tickFormat(d => lineChartConfig.dateFormat(new Date(d)))
        .tickPadding(0.1);
    const axisYLine = d3.axisLeft(yLineScale)
        .tickPadding(0.1);
    //end of Line

    drawArea(area);
    drawHeader(area);
    drawLineAxis(axisXLine, axisYLine, area);
    drawBarAxis(axisXBar, axisYBar, area);
    drawBars(barChartValues, xBarScale, yBarScale, area, barChartConfig);
    drawLines(area, lineChartValues, filteredData, lineGenerator, lineChartConfig);
    addListeners();
}

function filterData(data) {
    return {
        barChart: data[0],
        lineChart: filterLineData(data[1])
    }
}

function filterLineData(data){
    const values = [];
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
}

function drawHeader(area) {
    const header = svg
        .append('g')
        .attr('class', 'chart-header')
        .attr('transform', `translate(${(area.width + area.margin.left)/2}, ${area.margin.top/2})`)
        .append('text');

    header.append('tspan').text('Combo chart');
}

function drawLineAxis(axisX, axisY, area) {
    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left}, ${area.height + 50})`)
        .call(axisX)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -105)
        .attr("dy", ".35em")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "start");

    svg
        .append("g")
        .attr('transform', `translate(${area.margin.left}, 50)`)
        .call(axisY)
        .append("text")
}

function drawBarAxis(axisX, axisY, area) {
    // svg
    //     .append('g')
    //     .attr('transform', `translate(${area.margin.left}, ${area.height + 50})`)
    //     .call(axisX)
    //     .selectAll("text")
    //     .attr("y", 0)
    //     .attr("x", -105)
    //     .attr("dy", ".35em")
    //     .attr("transform", "rotate(-90)")
    //     .style("text-anchor", "start");

    svg
        .append("g")
        .attr('transform', `translate(${area.width + area.margin.left}, 50)`)
        .call(axisY)
        .append("text")
}

function drawBars(chartData, xScale, yScale, area, config) {
    svg
        .append("g")
        .attr('transform', `translate(${area.margin.left}, 50)`)
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

function drawLines(area, values, filteredData, lineGenerator, config) {
    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left}, 50)`)
        .data([filteredData])
        .append('path')
        .attr('stroke-dasharray', '4')
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .attr('stroke', config.color);

    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left}, 50)`)
        .data([values])
        .append('path')
        .attr('class', 'line')
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .style('stroke', config.color);
}

function mouseoverBar() {
    const data = d3.select(this).data()[0];
    d3.select('.tooltip')
        .style('left', `${d3.event.clientX + 15}px`)
        .style('top', `${d3.event.clientY}px`)
        .style('opacity', 0.98);

    d3.select('.tooltip').select('.tip-body').select('.y').html(`${barChartConfig.name}: ${data.y}${barChartConfig.unit}`);
    d3.select('.tooltip').select('.tip-body').select('.x').html(`date: ${barChartConfig.dateFormat(new Date(data.x))}`);
}

function mousemoveBar() {
    d3.select('.tooltip')
        .style('left', `${d3.event.clientX + 15}px`)
        .style('top', `${d3.event.clientY}px`)
}

function mouseoutBar() {
    d3.select('.tooltip')
        .style('opacity', 0);
}

function addListeners() {
    d3.selectAll('.bar').on('mouseover', mouseoverBar);
    d3.selectAll('.bar').on('mousemove', mousemoveBar);
    d3.selectAll('.bar').on('mouseout', mouseoutBar);
}

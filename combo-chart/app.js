// Load data.
d3.json('data/chartData2.json').then(result => {
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
    const xLineScale = d3.scaleBand()
        .domain(lineChartValues.map(d => d.x))
        .range([0, area.width])
        .paddingInner(0.1)
        .paddingOuter(0.1);

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
        .tickValues(xLineScale.domain().filter((d, i) => !(i % 5))) //<- filtruje wartości aby nie wyświetlać tick'a per Bar
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
    addRectOverlay(area);
    svg.append("g")
        .attr("class", "focusLine")
        .style('opacity', 0)
        .append("circle")
        .attr('transform', `translate(${area.margin.left + 7}, 50)`)
        .attr("r", 3);

    svg.append("g")
        .attr("class", "focusBar")
        .style('opacity', 0)
        .append("circle")
        .attr('transform', `translate(${area.margin.left}, ${area.height + 50})`)
        .attr("r", 3);

    addLineListeners();

    d3.selectAll('.overlay').on('mousemove', () => {
        const bisectDate = d3.bisector(d => d.x).left;
        const mouseX = d3.mouse(d3.event.currentTarget)[0];
        const bandWidth = xLineScale.step();
        const number = Math.round((mouseX - (bandWidth/2)) / bandWidth);
        const index = bisectDate(lineChartValues, xLineScale.domain()[number]);
        const lineData = lineChartValues[index];
        const barData = barChartValues[index];

        if ((lineData.x && lineData.y) || (barData.x && barData.y)) {
            d3.select('.focusLine').style('opacity', 0.98).attr("transform", "translate(" + xLineScale(lineData.x) + "," + yLineScale(lineData.y) + ")");
            d3.select('.tooltip').select('.tip-body').select('.yline').html(`${lineChartConfig.name}: ${lineData.y}${lineChartConfig.unit}`);
            d3.select('.tooltip').select('.tip-body').select('.xLine').html(`date: ${lineChartConfig.dateFormat(new Date(lineData.x))}`);

            d3.select('.tooltip').select('.tip-body').select('.yBar').html(`${barChartConfig.name}: ${barData.y}${barChartConfig.unit}`);
            d3.select('.tooltip').select('.tip-body').select('.xBar').html(`date: ${barChartConfig.dateFormat(new Date(barData.x))}`);
            //highlight
            d3.selectAll('.bar').style('fill', `${barChartConfig.color}`).filter((d, i) => i === index).style('fill', '#F00')
        } else {
            d3.select('.focus').style('opacity', 0);
        }

    });
}

function filterData(data) {
    return {
        barChart: filterBarData(data[0]),
        lineChart: filterLineData(data[1])
    }
}

function filterBarData(data) {
    const values = data.values.map(d => {
        return {
            x: new Date(d.x),
            y: d.y
        }
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

        if ((currDate - prevDate) <= MEASUREMENT_INTERVAL) {
            i === 1 ? values.push({x: prevDate, y: prev.y}) : null
            values.push({x: currDate, y: curr.y})
        } else {
            values.push({x: new Date(currDate.getTime() + 1000), y: null});
        }

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
    const width = 1000 - margin.left - margin.right;
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
        .attr('transform', `translate(${area.margin.left + 7}, 50)`)
        .data([filteredData])
        .append('path')
        .attr('stroke-dasharray', '4')
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .attr('stroke', config.color);

    svg
        .append('g')
        .attr('transform', `translate(${area.margin.left + 7}, 50)`)
        .data([values])
        .append('path')
        .attr('class', 'line')
        .attr('d', lineGenerator)
        .style('fill', 'none')
        .style('stroke', config.color);
}

function addRectOverlay(area) {
    svg
        .append("rect")
        .attr('transform', `translate(${area.margin.left}, 50)`)
        .attr("class", "overlay")
        .attr("width", area.width)
        .attr("height", area.height)
}

function addLineListeners() {
    d3.selectAll('.overlay').on('mouseover', () =>  {
        d3.select('.focusLine').style('opacity', 0.98);
        d3.select('.focusBar').style('opacity', 0.98);
        d3.select('.tooltip').style('opacity', 0.98);
    });
    d3.selectAll('.overlay').on('mouseout', () => {
        d3.select('.focusLine').style('opacity', 0);
        d3.select('.focusBar').style('opacity', 0);
        d3.select('.tooltip').style('opacity', 0);
    });
}

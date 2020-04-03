// Load data.
d3.json('data/chartData.json').then(result => {
    ready(result);
});

// Main function.
function ready(data) {
    const chartData = filterData(data);
    const config = {
        name: chartData.fullName,
        unit: chartData.unit,
        color: chartData.color
    };

    const values = chartData.values;
    const area = areaDimension();

    drawBase(area)
}

function filterData(data) {
    return data[0];
}

function areaDimension() {
    const margin = {top: 40, right: 40, bottom: 40, left: 40};
    const width = 400 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    return {
        margin: margin,
        width: width,
        height: height
    }
}

function drawBase(areaDimension) {
    d3.select('.bar-chart-container')
        .append('svg')
        .attr('width', areaDimension.width + areaDimension.margin.left + areaDimension.margin.right)
        .attr('height', areaDimension.height + areaDimension.margin.top + areaDimension.margin.bottom)
        .append('g')
        .attr('transform', `translate(${areaDimension.margin.left}, ${areaDimension.margin.top})`);
}



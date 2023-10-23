
        d3.dsv(",", "paper.csv", function (d) {
            return {
                source: d.source,
                target: d.target,
                value: +d.value
            }
        }).then(function (data) {
            var links = data;

            var nodes = {};

            // compute the distinct nodes from the links.
            links.forEach(function (link) {
                link.source = nodes[link.source] || (nodes[link.source] = { name: link.source });
                console.log('source', link.source)
                link.target = nodes[link.target] || (nodes[link.target] = { name: link.target });
                console.log('target', link.target)
            });

            var margin = { top: 50, right: 200, bottom: 80, left: 100 },
	//   , width = window.innerWidth - margin.left - margin.right // Use the window's width
	//   , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height
	width = innerWidth - margin.left - margin.right,
	height = 600 - margin.top - margin.bottom;

            var force = d3.forceSimulation()
                .nodes(d3.values(nodes))
                .force("link", d3.forceLink(links).distance(100))
                .force('x', d3.forceX().x(width * 0.5))
                .force('y', d3.forceY().y(height * 0.5))
                .force("charge", d3.forceManyBody().strength(-250))
                .alphaTarget(1)
                .on("tick", tick);

                d3.select("#my_dataviz")
                .append("svg")
                .attr("width", width)
                .attr("height", 50)
                .append("text")
                .attr("id", "title-a")
                .attr("x", width / 2)
                .attr("y", 0 - margin.top / 2)
                .attr("text-anchor", "end")
                .style("font-size", "20px")
                .style("font-weight", "bold")
                .text("Topics of the Semester")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var svg = d3.select("#my_dataviz").append("svg")
                .attr("width", width)
                .attr("height", height);

            // add the links
            var path = svg.append("g")
                .selectAll("path")
                .data(links)
                .enter()
                .append("path")
                .attr("class", function (d) { return "link " + d.type; })
                // • If the value of the edge is equal to 0 (similar), the edge should be gray, thick, and solid (The dashed line with zero gap is not considered as solid). 
                // • If the value of the edge is equal to 1 (not similar), the edge should be green, thin, and dashed.
                .style("stroke", function (d) {
                    if (d.value == 0) return "gray";
                    else return "green";
                })
                .style("stroke-dasharray", function (d) {
                    if (d.value == 1) return "4 3";
                })
                .style("stroke-width", function (d) {
                    if (d.value == 0) return "3.0px";
                    else return "1.0px";
                });

            // define the nodes
            var node = svg.selectAll(".node")
                .data(force.nodes())
                .enter().append("g")
                .attr("class", "node")
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            // add the nodes
            node.append("circle")
                .attr("id", function (d) {
                    return (d.name.replace(/\s+/g, '').toLowerCase());
                })
                // .attr("r", 3);
                .attr("r", function (d) {
                    d.weight = path.filter(function (p) {
                        return p.source.index == d.index || p.target.index == d.index
                    }).size();
                    var minRadius = 2;
                    return minRadius + (d.weight * 2);
                })
                .style("fill", function (d) {
                    if (d.weight < 2) return "#fee1c3";
                            else if (d.weight < 5) return "#ec6513";
                            else return "#892b04";
                })
                .on("dblclick", function (d) {
                    if (d.fixed == true) {
                        unpin_node(d);
                        console.log("unpin_node")
                        console.log(d3.select(this))
                        d3.select(this).style("fill", function (d){
                            if (d.weight < 2) return "#fee1c3";
                            else if (d.weight < 5) return "#ec6513";
                            else return "#892b04";
                        });
                    }
                });

            // add node labels
            node.append("text")
                .attr("dx", 16)
                .attr("dy", -16)
                .style('font-weight', 'bold')
                .style("text-anchor", "start")

                .text(function (d) { return d.name });

            // add the curvy lines
            function tick() {
                path.attr("d", function (d) {
                    var dx = d.target.x - d.source.x,
                        dy = d.target.y - d.source.y,
                        dr = Math.sqrt(dx * dx + dy * dy);
                    return "M" +
                        d.source.x + "," +
                        d.source.y + "A" +
                        dr + "," + dr + " 0 0,1 " +
                        d.target.x + "," +
                        d.target.y;
                });

                node.attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
            };

            function dragstarted(d) {
                console.log("dragstarted")
                if (!d3.event.active) force.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            };

            function dragged(d) {
                console.log("dragged")
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            };

            function dragended(d) {
                d3.select(this.getElementsByTagName('circle')[0]).style("fill", "rgb(12,200,450)");
                console.log("dragended")
                if (!d3.event.active) force.alphaTarget(0);
                if (d.fixed == true) {
                    d.fx = d.x;
                    d.fy = d.y;
                }
                else {
                    pin_node(d);
                    d.fx = d.x;
                    d.fy = d.y;
                }
            };
            
            function pin_node(d) {
                console.log("pin_node")
                d.fixed = true;
                d.fx = d.x;
                d.fy = d.y;
            };

            function unpin_node(d) {
                console.log("unpin_node")
                d.fixed = false;
                d.fx = null;
                d.fy = null;
            };

        }).catch(function (error) {
            console.log(error);
        });
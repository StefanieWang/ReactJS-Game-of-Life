
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import $ from 'jquery';
import './index.css';

const drawAliveCell=(props)=>{
	const {ctx, cell, gridSize} = props;
	ctx.fillRect(cell[0]+1, cell[1]+1, gridSize-1, gridSize-1);
}

class CanvasGameBoard extends React.Component {
	updateCanvas(){
		const gridSize = 10;
		const width = this.props.boardSize[0]*gridSize;
    	const height = this.props.boardSize[1]*gridSize; 
		const ctx = this.refs.canvas.getContext("2d");
		ctx.clearRect(0,0,width,height);
		ctx.fillStyle = "#000";
		ctx.fillRect(0,0,width, height);
 
        this.props.aliveOldCells.forEach((cell)=>{
        	ctx.fillStyle = "#00b500";
        	drawAliveCell({ctx, cell, gridSize});
        });

        this.props.aliveNewCells.forEach((cell)=>{
        	ctx.fillStyle = "#7db87d";
        	drawAliveCell({ctx, cell, gridSize});
        })

        ctx.strokeStyle = "#4c4c4c";
		ctx.lineWidth = 2;
        //draw vertical lines
        for(let i=gridSize; i<width; i+=gridSize){
        	ctx.beginPath();
        	ctx.moveTo(i, 0);
        	ctx.lineTo(i, height);         	     	
        	ctx.stroke();
        };
        //draw horizontal lines
        for(let j=gridSize; j<height; j+=gridSize){
        	ctx.beginPath();
        	ctx.moveTo(0, j);
        	ctx.lineTo(width, j);   
			ctx.stroke();
        };
        
	}

    componentDidMount(){            
        this.updateCanvas();
    }

	componentDidUpdate(){    	
		this.updateCanvas();  
	}

    clickHandler(e){
        const rect = this.refs.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left)/10)*10;
        const y = Math.floor((e.clientY - rect.top)/10)*10;
        console.log([x,y]);
        this.props.addCells([x,y]);
    }

	render(){
		const gridSize = 10;
		const width = this.props.boardSize[0]*gridSize;
    	const height = this.props.boardSize[1]*gridSize;
		return(
			<canvas ref="canvas" width={width} height={height} onClick={this.clickHandler.bind(this)}/>

		)
	}
}

CanvasGameBoard.propTypes = {
    boardSize: PropTypes.array.isRequired,
    aliveOldCells: PropTypes.array.isRequired,
    aliveNewCells: PropTypes.array.isRequired,
    addCells: PropTypes.func.isRequired
}

/*class ButtonGroups extends React.Component{

    render(){
        return <div></div>
    }
}*/

class GamePanel extends React.Component {
	constructor(){
		super();
		this.state={
	        boardSize: [50, 30],
	        simSpeed: 100,
	        aliveOldCells: [[20,20],[20,30],[30,20],[30,30],
                            [70,20],[80,20],[60,30],[70,40],[80,50],[90,40],[90,30],
                           [20,90],[30,90],[40,100],[30,110],[20,110],[10,100],
                            [90,90],[80,100],[90,110],[100,100],
                            [130,30],[120,30],[140,30],
                            [170,30],[180,30],[190,30],[180,20],[190,20],[200,20],
                           [220,100],[230,100],[240,100],[230,90],
                           [340,60],[350,70],[350,80],[340,80],[330,80],
                            [430,200],[420,210],[420,220],[420,230],[430,230],[440,230],[450,230],[460,220],[460,200],
                            [140,100],[150,100],[160,100],[130,110],[140,110],[150,110],[140,120],[150,120],[160,130],
                            [370,80],[360,90],[360,100],[360,110],[370,110],[380,110],[390,110],[400,100],[400,80]],
	        aliveNewCells: []

		}

        this.timer = undefined;
        this.generations = 0;
        this.populations = this.state.aliveOldCells.length + this.state.aliveNewCells.length;
        this.stillLifes = [[20,20],[20,30],[30,20],[30,30],
                            [70,20],[80,20],[60,30],[70,40],[80,50],[90,40],[90,30],
                           [20,90],[30,90],[40,100],[30,110],[20,110],[10,100],
                            [90,90],[80,100],[90,110],[100,100]];
        this.oscillator = [[130,30],[120,30],[140,30],
                            [170,30],[180,30],[190,30],[180,20],[190,20],[200,20],
                            [220,100],[230,100],[240,100],[230,90]];
                            
        this.spaceships = [[340,60],[350,70],[350,80],[340,80],[330,80],
                            [430,200],[420,210],[420,220],[420,230],[430,230],[440,230],[450,230],[460,220],[460,200]];
        
        this.getRandomCells = this.getRandomCells.bind(this);                  
		this.setBoardSize = this.setBoardSize.bind(this);
		this.setSpeed = this.setSpeed.bind(this);
        this.stopGameOfLife = this.stopGameOfLife.bind(this);
        this.runGameOfLife = this.runGameOfLife.bind(this);
        this.stepRun = this.stepRun.bind(this);
        this.clearBoard = this.clearBoard.bind(this);
        this.addCells = this.addCells.bind(this)
        this.choosePattern = this.choosePattern.bind(this);
	}
    
    countPopulations(aliveOldCells, aliveNewCells){
        const populations = aliveOldCells.length + 
                            aliveNewCells.length;
        return populations
    }

    cellInBoard(x, y, width, height){
        return ( x >= 0 &&
        	     x <= width &&
        	     y >= 0 &&
        	     y <= height)
    }
    
    findNeighbours(cell, gridSize){
    	const d = gridSize;
    	const width = this.state.boardSize[0]*gridSize;
    	const height = this.state.boardSize[1]*gridSize
        const neighbours = [[-d, -d], [0, -d], [d, -d], [-d, 0], [d, 0],[-d, d], [0, d], [d, d]];
        let neighbourCells = [];
        neighbours.forEach((item) => {
        	const x = cell[0]+item[0];
        	const y = cell[1]+item[1];
        	if(this.cellInBoard(x, y, width, height)){
        		neighbourCells.push([x, y]);
        	}
        })
        return neighbourCells;
    }

    cellsEqual(cell1, cell2){
    	return (cell1[0] === cell2[0] &&
    		cell1[1] === cell2[1])
    }

    findAliveNeighbours(neighbourCells, aliveCells){
        const aliveNeighbourCells = neighbourCells.filter((neighbourCell) => {
            return aliveCells.find((aliveCell) => this.cellsEqual(aliveCell, neighbourCell));
        })
        return aliveNeighbourCells;
    }
    
    findDeadNeighbours(neighbourCells, aliveCells){
    	const deadNeighbourCells = neighbourCells.filter((neighbourCell) => {
            return !aliveCells.find((aliveCell) => this.cellsEqual(aliveCell, neighbourCell));
    	})
    	return deadNeighbourCells;
    }
   
    updateCells(){
	    const aliveCells1 = this.state.aliveOldCells;
	    const aliveCells2 = this.state.aliveNewCells;
	    let aliveCells = aliveCells1.concat(aliveCells2);
	    const gridSize =10;
	    let indexOfCellWillDie = [];
	    let cellsWillBorn = [];
	    aliveCells.forEach((cell, index) => {
	    	const neighbourCells = this.findNeighbours(cell, gridSize);
	    	
	    	const aliveNeighbourCells = this.findAliveNeighbours(neighbourCells, aliveCells);
	    	
	    	const deadNeighbourCells = this.findDeadNeighbours(neighbourCells, aliveCells);
            //if the alive cell has 2-3 alive neighbours, it will still be 
            //alive in next generation, otherwise it will die.
            if (aliveNeighbourCells.length < 2 ||
            	aliveNeighbourCells.length > 3){
            	indexOfCellWillDie.push(index);
            };
            //if a dead cell has exactly 3 alive neighbours, it will come to life
            // in next generation
            deadNeighbourCells.filter((deadCell) => {
            	const neighboursOfDeadCell = this.findNeighbours(deadCell, gridSize);
            	const aliveNeighboursCells = this.findAliveNeighbours(neighboursOfDeadCell, aliveCells);
            	if(aliveNeighboursCells.length === 3 &&
                 !cellsWillBorn.find((newCell) => this.cellsEqual(newCell, deadCell))){
                    cellsWillBorn.push(deadCell);
            	}
            })
	    })
        
        // remove the cells will die
        aliveCells = aliveCells.filter((cell, index) => {
        	return !indexOfCellWillDie.includes(index);
        })

	    this.generations++;
        this.populations = this.countPopulations(aliveCells, cellsWillBorn);
	    this.setState({
	    	aliveOldCells: aliveCells,
	    	aliveNewCells: cellsWillBorn           
	    }) 
        

    }

    getRandomCells(){
       const boardSizeX = this.state.boardSize[0];
       const boardSizeY = this.state.boardSize[1];
       const randomPopulations = Math.floor(Math.random()*boardSizeX*boardSizeY/2);
       let randomCells = [];
       for(let i=0; i<randomPopulations; i++){
          const x = Math.floor(Math.random()*boardSizeX)*10;
          const y = Math.floor(Math.random()*boardSizeY)*10;
          const notExist = randomCells.every((cell) =>{
            return !this.cellsEqual(cell, [x, y])
          })
          if(notExist){ 
            randomCells.push([x, y])
          };
       }
     
        return randomCells;
    }

    addCells(newCell){
        let cellExist = false;
        let aliveNewCells = this.state.aliveNewCells;
        const aliveOldCells = this.state.aliveOldCells;
        const aliveCells = aliveOldCells.concat(aliveNewCells);

        cellExist = aliveCells.find((cell) => this.cellsEqual(cell, newCell))
 
        if(!cellExist){
            aliveNewCells.push(newCell);
            this.setState({
                aliveNewCells: aliveNewCells
            })
        }
               
    }

    highlightBtn(e, btnGroup){
        $("."+btnGroup).removeClass("highlight");
        const target = e.target;
        $(target).addClass("highlight");
    }

    choosePattern(e, pattern){
        this.highlightBtn(e, "patternBtn");
        this.stopGameOfLife();
        this.generations = 0;
        this.populations = this.countPopulations([], pattern);
        this.setState({
            aliveOldCells:[],
            aliveNewCells: pattern
        })
    }

	setBoardSize(e, boardSize){
        this.highlightBtn(e, "bdSizeBtn");
        this.stopGameOfLife();
        this.generations = 0;
        this.populations = 0;
		this.setState({
			boardSize: boardSize,
            aliveNewCells: [],
            aliveOldCells: []
		})
	}

	setSpeed(e, simSpeed){
        this.highlightBtn(e, "speedBtn");
        this.stopGameOfLife();
		this.setState({
			simSpeed: simSpeed
		});

	}

    runGameOfLife(e=undefined){
        if(e) { this.highlightBtn(e, "controlBtn") };
        this.stopGameOfLife();
        /*if(!this.timer){*/
            const simSpeed = this.state.simSpeed;
            const timer = setInterval(this.updateCells.bind(this), simSpeed);
            this.timer = timer;
        /*}*/
        
    }
    
    stopGameOfLife(e=undefined){
        if(e) { this.highlightBtn(e, "controlBtn") };
        if(this.timer){
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        
    }

    stepRun(e){
        this.highlightBtn(e, "controlBtn");
        this.stopGameOfLife();
        const simSpeed = this.state.simSpeed;
        const timer = setTimeout(this.updateCells.bind(this), simSpeed);
        this.timer = timer;
    }

    clearBoard(e){
        this.highlightBtn(e, "controlBtn");
        this.stopGameOfLife();
        this.generations = 0;
        this.populations = 0;
        this.setState({
            aliveOldCells: [],
            aliveNewCells: []
        })
    }

    componentDidMount(){
        this.runGameOfLife();
    }
    
    componentWillUnmount(){
    	clearTimeout(this.timer);
    }

    render(){
    	return (
    		<div className="container">
                <h1>Game of Life</h1>
				<div className="control-panel">
				    <button className = "controlBtn highlight" onClick = {(e) => this.runGameOfLife(e)}>Run</button>
				    <button className = "controlBtn" onClick = {(e) => this.stopGameOfLife(e)}>Pause</button>
                    <button className = "controlBtn" onClick = {(e) => this.stepRun(e)}>Step</button>
				    <button className = "controlBtn" onClick = {(e) => this.clearBoard(e)}>Clear</button>
                </div>
                <div>
		    		<div className="count">{"Generations: "+this.generations}</div>
                    <div className="count">{"Populations: "+this.populations}</div>
				</div>
				<div className="game-board">
					<CanvasGameBoard boardSize={this.state.boardSize}
								aliveOldCells={this.state.aliveOldCells} 
								aliveNewCells={this.state.aliveNewCells}
                                addCells={this.addCells}/>
				</div>
                <div className="footer-control-panel">
    				<div>
                        Board Size: 
                        <button className="bdSizeBtn highlight" onClick = {(e) => this.setBoardSize(e,[50, 30])}>Size: 50×30</button>
                        <button className="bdSizeBtn" onClick = {(e) => this.setBoardSize(e,[70, 50])}>Size: 70×50</button>
                        <button className="bdSizeBtn" onClick = {(e) => this.setBoardSize(e,[100, 80])}>Size: 100×80</button>
                    </div>
                    <div>
                        Sim Speed <span style={{fontFamily: "sans-serif"}}>(press Run to start)</span> :  
                        <button className = "speedBtn" onClick = {(e) => this.setSpeed(e, 500)}>Slow</button>
                        <button className = "speedBtn" onClick = {(e) => this.setSpeed(e, 200)}>Medium</button>
                        <button className = "speedBtn highlight" onClick = {(e) => this.setSpeed(e, 100)}>Fast</button>
                    </div>
                    <div>
                        Choose Patterns: 
                        <button className = "patternBtn" onClick = {(e) => this.choosePattern(e, this.stillLifes)}>Still Lifes</button>
                        <button className = "patternBtn" onClick = {(e) => this.choosePattern(e, this.oscillator)}>Oscillators</button>
                        <button className = "patternBtn" onClick = {(e) => this.choosePattern(e, this.spaceships)}>Spaceships</button>
                        <button className = "patternBtn" onClick = {(e) => this.choosePattern(e, this.getRandomCells())}>Random</button>
                    </div>
                </div>
    		</div>
    		)
    }
}

ReactDOM.render(<GamePanel />, document.getElementById('app'));

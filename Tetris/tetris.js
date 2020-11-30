var canvas;
var gl;
var program;

var ROWS = 20; 
var COLUMNS = 12; // 12*20个格子

var width=480;
var height = 800;
var gridSide = width/COLUMNS;

//当前落下的方块的中心在grids中的坐标
var currentX;
var currentY;
//当前方块的信息
var currentBlock = {};

//颜色
var COLOR1 = vec4(0, 0, 1,1);
var COLOR2 = vec4(0, 1, 0,1);
var COLOR3 = vec4(1, 0, 0,1);
var COLOR4 = vec4(0, 1, 1,1);
var COLOR5 = vec4(1, 0, 1,1);
var COLOR6 = vec4(1, 1, 0,1);
var COLOR7 = vec4(0, 0.5, 0.5,1);
var BLACK = vec4(0, 0, 0,1);
var Colors = [ COLOR1, COLOR2, COLOR3, COLOR4, COLOR5, COLOR6, COLOR7 ];

//格子顶点
var LinePoints=[]; 
//格子数组
var grids = [];
//自底向上逐行存每个顶点的坐标
for(var i=0;i<=ROWS+2;i++)
{
    for(var j=0;j<=COLUMNS;j++)
    {
        LinePoints.push(ordinateConvert(j*gridSide,i*gridSide));
    }
}

//着色器各变量的Loc
var uColorLoc;

//设置间隙调用Id
var intervalId = null;

//方块移动方式的枚举，用具碰撞检测
var MotionType = {
    Down : 0, //下落
    Left : 1,  //左右平移
    Right : 2,
    Rotate: 3 ,  //旋转
    Appear : 4,  //生成方块
}

//期间键盘输入无效标志
var Forbbid = false;
//得分
var score=  0;
//游戏速度
var gameSpeed = 400;

//七种俄罗斯方块
var Oblock = {
    style:[
        {
        direction:[
            vec2(0, 0),
            vec2(-1, 0),
            vec2(-1, -1),
            vec2(0, -1)
         ]
        }
    ],
    styleIndex:0
}

var Iblock = {
    style:[
        {
            direction:[
                vec2(0, 0),
                vec2(1, 0),
                vec2(-1, 0),
                vec2(-2, 0)
         ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(0, 1),
                vec2(0, -1),
                vec2(0, -2)
             ]
        }
    ],
    styleIndex:0
}
   
var Sblock = {
    style:[
        {
            direction:[
                vec2(0, 0),
                vec2(1, 0),
                vec2(0, -1),
                vec2(-1, -1)
         ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(0, 1),
                vec2(1, 0),
                vec2(1, -1)
             ]
        }
    ],
    styleIndex:0
}

var Zblock = {
    style:[
        {
            direction:[
                vec2(0, 0),
                vec2(-1, 0),
                vec2(0, -1),
                vec2(1, -1)
         ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(0, -1),
                vec2(1, 0),
                vec2(1, 1)
             ]
        }
    ],
    styleIndex:0
}

var Lblock = {
    style:[
        {
            direction:[
                vec2(0, 0),
                vec2(-1, 0),
                vec2(1, 0),
                vec2(-1, -1)
         ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(0, -1),
                vec2(0, 1),
                vec2(1, -1)
             ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(-1, 0),
                vec2(1, 0),
                vec2(1, 1)
             ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(0, -1),
                vec2(0, 1),
                vec2(-1, 1)
             ]
        }
    ],
    styleIndex:0
}

var Jblock = {
    style:[
        {
            direction:[
                vec2(0, 0),
                vec2(-1, 0),
                vec2(1, 0),
                vec2(1, -1)
         ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(0, -1),
                vec2(0, 1),
                vec2(1, 1)
             ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(-1, 0),
                vec2(-1, 1),
                vec2(1, 0)
             ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(0, -1),
                vec2(0, 1),
                vec2(-1, -1)
             ]
        }
    ],
    styleIndex:0
}

var Tblock = {
    style:[
        {
            direction:[
                vec2(0, 0),
                vec2(-1, 0),
                vec2(1, 0),
                vec2(0, -1)
         ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(0, -1),
                vec2(0, 1),
                vec2(1, 0)
             ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(-1, 0),
                vec2(1, 0),
                vec2(0, 1)
             ]
        },
        {
            direction:[
                vec2(0, 0),
                vec2(0, -1),
                vec2(0, 1),
                vec2(-1, 0)
             ]
        }
    ],
    styleIndex:0
}

var blockFactory = [Oblock,Iblock,Sblock,Zblock,Lblock,Jblock,Tblock];

window.onload = function init()
{
    window.addEventListener("keydown",myKeyDown);

    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.98, 0.941, 0.902, 1.0);
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    initGrids();
    getBlock();
}

function loop()
{
    currentY = ROWS-1;
    currentX = COLUMNS/2;
    if(checkFail())
    {
        alert("Game Over!You Scored:"+score);
    }
    else{
        getBlock();
    }
}
//画边线
function drawLines(){

    var index =[];
    for(var i=0;i<=ROWS;i++)
    {
        index.push(i*(COLUMNS+1),i*(COLUMNS+1)+COLUMNS);
    }

    for(var j=0;j<=COLUMNS;j++)
    {
        index.push(j,(COLUMNS+1)*ROWS+j);
    }
    var LineIndex = new Uint16Array(index);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(LinePoints), gl.STATIC_DRAW );
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var LineIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,LineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,LineIndex,gl.STATIC_DRAW);

    uColorLoc = gl.getUniformLocation(program, "uColor");
    gl.uniform4f(uColorLoc, 0.0, 0.0, 0.0,1.0);

    gl.drawElements(gl.LINES, 2*(ROWS+1)+2*(COLUMNS+1), gl.UNSIGNED_SHORT, 0);
    gl.deleteBuffer(LineIndexBuffer);
}

//grid为 COLUMN * (ROW+2) 顶部有两行不可见，用于存储还局部还未落入面板的格子    
function initGrids()
{
    for(var j = 0;j<COLUMNS;j++)
    {
        var array = [];
        grids.push(array);
    }

    for(var i=0;i<ROWS+2;i++)
    {
        for(var j = 0;j<COLUMNS;j++)
        {
            var newBlock = {
                spare:true,
                loc:[ordinateConvert(j*gridSide,i*gridSide), //从左下点开始逆时针存放
                    ordinateConvert((j+1)*gridSide,i*gridSide),
                    ordinateConvert((j+1)*gridSide,(i+1)*gridSide),
                    ordinateConvert(j*gridSide,(i+1)*gridSide)
                ] , 
                index:[                             //存放绘制该图格的索引
                    i*(COLUMNS+1)+j,
                    i*(COLUMNS+1)+j+1,
                    (i+1)*(COLUMNS+1)+j+1,
                    i*(COLUMNS+1)+j,
                    (i+1)*(COLUMNS+1)+j,
                    (i+1)*(COLUMNS+1)+j+1,
                ],
                color: [0.98, 0.941, 0.902, 1.0] //默认与背景颜色相同
                   
            };
            grids[j][i] = newBlock;
        }
    }
}

//对格子进行着色
function drawGrids()
{
    var _index = [];
    for(var i=0;i<ROWS;i++)
    {
        for(var j = 0;j<COLUMNS;j++)
        {
             _index = _index.concat(grids[j][i].index);
        }
    }
    var GridIndex = new Uint16Array(_index);

  //  gl.clear( gl.COLOR_BUFFER_BIT );
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(LinePoints), gl.STATIC_DRAW );
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var GridIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,GridIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,GridIndex,gl.STATIC_DRAW);

    for(var i=0;i<ROWS;i++)
    {
        for(var j = 0;j<COLUMNS;j++)
       {
            uColorLoc = gl.getUniformLocation(program, "uColor");
            gl.uniform4fv(uColorLoc,grids[j][i].color);
            gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,(i*COLUMNS+j)*6*2);
       }
   }
}

//随机获取一个方块，并开始falldown的间歇调用
function getBlock()
{
    Forbbid = false;
    //设定Block降落的位置和朝向
    currentY = ROWS-1;
    currentX = COLUMNS/2;

    currentBlock = blockFactory[Math.floor(Math.random()*7)];//随机取七种方块的一种
    currentBlock.color = Colors[Math.floor(Math.random()*7)];//随机取颜色
    drawAll();
    intervalId = setInterval(falldown, gameSpeed);
}

//获取currentBlock所处grids的索引并绘制
function drawCurrentBlock()
{
    var _index =[]; 
    var offsetList = currentBlock.style[currentBlock.styleIndex];
    for(var i=0;i<offsetList.direction.length;i++)
    {
        _index = _index.concat(grids[currentX+offsetList.direction[i][0]][currentY+offsetList.direction[i][1]].index);
    }
    var CurrentBlockIndex = new Uint16Array(_index);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(LinePoints), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var CurrentBlockIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,CurrentBlockIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,CurrentBlockIndex,gl.STATIC_DRAW);
    for(var i=0;i<offsetList.direction.length;i++)
    {
        uColorLoc = gl.getUniformLocation(program, "uColor");
        gl.uniform4fv(uColorLoc,currentBlock.color);
        gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,i*6*2);
    }
}

function falldown()
{
    if(checkCollision(MotionType.Down))
    {
        currentY--;
        drawAll();
    }else{
        stopFalling();
    }
}

/**
 * 碰撞检测，包括对CurrentBlock左右和下方三个方面
 * return : bool类型，表示是否可以移动
 */
function checkCollision(type)
{
    //检测，包括与grids中非spare区域的检测，和触底检测

    var flag = true ;
    var offsetList = currentBlock.style[currentBlock.styleIndex].direction;
    switch(type)
    {   
        //下移检测
        case MotionType.Down:
            {
                for(var i=0;i<offsetList.length;i++)
                {
                    flag = flag && (currentY-1+offsetList[i][1]>=0)  //触底检测
                                && grids[currentX+offsetList[i][0]][currentY-1+offsetList[i][1]].spare;//spare检测
                }
                return flag;
            }

        //左右移检测
        case MotionType.Left:
            {
                for(var i=0;i<offsetList.length;i++)
                {
                    flag = flag && (currentX-1+offsetList[i][0]>=0)  //左边界检测
                                && grids[currentX-1+offsetList[i][0]][currentY+offsetList[i][1]].spare;// spare检测
                }
                return flag;
            }
        case MotionType.Right:
            {
                for(var i=0;i<offsetList.length;i++)
                {
                    flag = flag && (currentX+1+offsetList[i][0]<=COLUMNS-1)  //右边界检测
                                && grids[currentX+1+offsetList[i][0]][currentY+offsetList[i][1]].spare;// spare检测
                }
                return flag;
            }
        case MotionType.Rotate:
            {
                var index = (currentBlock.styleIndex+1)%currentBlock.style.length; // 获取Rotate后currentblock的styleindex
                offsetList = currentBlock.style[index].direction; //获取direction数组
                for(var i=0;i<offsetList.length;i++)
                {
                    flag = flag &&  (currentX+offsetList[i][0]<=COLUMNS-1)  //右边界检测
                                &&  (currentX+offsetList[i][0]>=0) //左边界检测
                                &&  (currentY+offsetList[i][1]>=0) //触底检测
                                && grids[currentX+offsetList[i][0]][currentY+offsetList[i][1]].spare; // spare检测
                }
                return flag;
            }
        case MotionType.Appear:
            {
                for(var i=0;i<offsetList.length;i++)
                {
                    flag = flag && grids[currentX+offsetList[i][0]][currentY+offsetList[i][1]].spare;// spare检测
                }
                return flag; 
            }
    }
}

//将600*800坐标系转换为convas坐标系（-1...1)
function ordinateConvert(x,y){
    var newX = 1/(width/2)*x-1;
    var newY = 1/(height/2)*y-1;
    return vec2(newX,newY);
}

function drawAll()
{
    drawGrids();
    drawCurrentBlock();
    drawLines();
}

//键盘输入事件
function myKeyDown(e)
{
    //禁止操作
    if(Forbbid) return;

    var evt = e || window.event || arguments.callee.caller.arguments[0];
    switch(evt.keyCode){
         //Left
        case 37:
            if(checkCollision(MotionType.Left))
            {
                currentX--;
                drawAll();
                break;
            }
            break;
        //Up
        case 38:
            if(checkCollision(MotionType.Rotate))
            {
                currentBlock.styleIndex = (currentBlock.styleIndex+1)%currentBlock.style.length;
                drawAll();
                break;
            }
            break;

        //Right 
        case 39:
            if(checkCollision(MotionType.Right))
            {
                currentX++;
                drawAll();
                break;
            }
            break;

        //Down
        case 40:
            if(checkCollision(MotionType.Down))
            {
                currentY--;
                drawAll();
                break;
            }else
            {
                stopFalling();
                break;
            }
                  
    }
}

/**
 * 在检测下方遇到碰撞后停止下落，将currentblock写入grids,停止falldown的间歇调用
 */
function stopFalling()
{
    var offsetList = currentBlock.style[currentBlock.styleIndex].direction;
    for(var i=0;i<offsetList.length;i++)
    {
        grids[currentX+offsetList[i][0]][currentY+offsetList[i][1]].spare = false;
        grids[currentX+offsetList[i][0]][currentY+offsetList[i][1]].color = currentBlock.color;
    }
    Forbbid = true;
    clearInterval(intervalId);
    checkClearRows();
    loop();
}

//每填满一行则消除
function checkClearRows()
{
    for(var i=0;i<ROWS;i++)
    {
        var row_unspare = true;//该行是否全被填充
        for(var j=0;j<COLUMNS;j++)
        {
            row_unspare = row_unspare && !grids[j][i].spare;
            if(!row_unspare) break;
        }
        if(row_unspare)
        {
            score+=10;
            for(var m=i;m<ROWS;m++)
            {
                for(var n=0;n<COLUMNS;n++)
                {
                    grids[n][m].color = grids[n][m+1].color;
                    grids[n][m].spare = grids[n][m+1].spare;
                }
            }
            drawAll();
            checkClearRows();
        }
    }
    
}

/**
 * 判断失败
 * return true:fail
 */
function checkFail()
{
    return !checkCollision(MotionType.Appear);
}
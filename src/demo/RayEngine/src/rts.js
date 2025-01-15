const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let lightSources = [{
    x: 300, y: 200, radius: 10, color: "#ffffff", numRays: 100, spreadAngle: 360, rayLength: 1000, blur: 0
}];

let objects = [];

let isDraggingLight = false;
let draggingLightIndex = -1;
let selectedObjectIndex = -1;
let isDraggingObject = false;
let draggingObjectOffsetX = 0;
let draggingObjectOffsetY = 0;
let isRotatingObject = false;
let rotatingObjectCenter = {x:0, y:0};
let rotationStartAngle = 0;
let cameraX = 0;
let cameraY = 0;
let cameraScale = 1;
let isDraggingCamera = false;
let cameraDragStartX = 0;
let cameraDragStartY = 0;
let uiState = {
    showMenu: false,
    selectedLightIndex: -1,
    selectedObject: -1,
    isEditingUI: false,
    modal: null,
      scriptModal: null
}
let uiElements = [];
let modalInput = null;
let currentScript = null;
let time = 0;
let mouseX = 0;
let mouseY = 0;


function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function drawCameraInfo() {
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Cam: ${cameraX.toFixed(0)}, ${cameraY.toFixed(0)} Scale: ${cameraScale.toFixed(2)}`, 10, 20);
}

function applyCameraTransform() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(cameraScale, cameraScale);
    ctx.translate(-canvas.width / 2 + cameraX, -canvas.height / 2 + cameraY);
}

function resetTransform() {
    ctx.restore();
}

function createUI() {
    uiElements = [
      {
        type: 'button',
          x: 10, y: 50, width: 150, height: 30, text: 'Add Segment',
          onClick: () => {
            const segment = { type: 'segment', x: canvas.width/2 , y: canvas.height/2, length: 100, angle: 0, color: '#ffffff', hitBox: 10, reflect: 0, scripts: [] };
            objects.push(segment);
        }
      },
      {
          type: 'button',
          x: 10, y: 90, width: 150, height: 30, text: 'Add Circle',
          onClick: () => {
            const circle = { type: 'circle', x: canvas.width/2, y: canvas.height/2, radius: 30, color: '#ffffff', angle: 0, reflect: 0, scripts: []};
            objects.push(circle);
        }
      },
       {
          type: 'button',
          x: 10, y: 130, width: 150, height: 30, text: 'Add Rect',
          onClick: () => {
               const rect = { type: 'rect', x: canvas.width/2, y: canvas.height/2, width: 60, height: 40, angle: 0, color: '#ffffff', reflect: 0, scripts: []};
               objects.push(rect);
          }
      },
      {
          type: 'button',
          x: 10, y: 170, width: 150, height: 30, text: 'Add Arc',
          onClick: () => {
               const arc = { type: 'arc', x: canvas.width/2, y: canvas.height/2, radius: 30, startAngle: 0, endAngle: 180, angle: 0, color: '#ffffff', reflect: 0, scripts: []};
               objects.push(arc);
          }
      },
    {
         type: 'label', x: 10, y: 220, text: 'Light Sources:'
    },
      ...lightSources.map((light, index) => ({
          type: 'button',
           x: 10, y: 240 + index * 30, width: 150, height: 25, text: `Light ${index+1}`,
           onClick: () => {
            uiState.selectedLightIndex = index;
             uiState.selectedObject = -1;
           },
           isSelected: uiState.selectedLightIndex === index
       })),
        {
            type: 'button',
              x: 10, y: 240 + lightSources.length * 30, width: 50, height: 30, label: "Count", value: lightSources.length,
                 onClick: (element) => {
                    showModal("Count", lightSources.length, (value) => updateLightSources(parseInt(value)), 'number', element);
                 }
        },

        {
            type: 'label', x: 10, y: 330 + lightSources.length * 30, text: 'Objects:'
        },
     ...objects.map((obj, index) => ({
          type: 'button',
           x: 10, y: 350 + lightSources.length * 30 + index * 30, width: 150, height: 25, text: `${obj.type} ${index+1}`,
           onClick: () => {
             uiState.selectedObject = index;
             uiState.selectedLightIndex = -1;
           },
            isSelected: uiState.selectedObject === index
       })),
        {
             type: 'inspector', x: canvas.width - 250, y: 10, width: 240, height: canvas.height - 20
        }
  ];
}



function updateUI() {
  uiElements = uiElements.map(el => {
      if (el.type === 'button' ) {
          el.isSelected = uiState.selectedLightIndex >= 0 ?  lightSources.indexOf(lightSources[uiState.selectedLightIndex])  === uiElements.indexOf(el) - 4:  uiState.selectedObject >= 0 ? objects.indexOf(objects[uiState.selectedObject])  === uiElements.indexOf(el) - 5 - lightSources.length -1 : false;
      }

      return el;
   });
    createUI();
}

function drawUI() {
    uiElements.forEach(el => {
         ctx.fillStyle = "#444"
          if (el.type === 'button') {
             ctx.fillRect(el.x, el.y, el.width, el.height);
               ctx.fillStyle = el.isSelected ? "yellow" : "#fff";
             ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
             ctx.fillText(el.text, el.x + el.width/2, el.y + el.height/2 + 5);
              if (el.label) {
                ctx.fillStyle = "#fff";
                ctx.textAlign = "left";
                 ctx.fillText(el.label, el.x + 60, el.y + 15);
              }
          }
        if (el.type === 'label') {
              ctx.fillStyle = "#fff";
             ctx.font = "14px sans-serif";
             ctx.textAlign = "left";
              ctx.fillText(el.text, el.x, el.y + 15);
        }
       
        if(el.type === 'inspector' && (uiState.selectedLightIndex > -1 || uiState.selectedObject > -1)) {
            const obj = uiState.selectedLightIndex > -1 ? lightSources[uiState.selectedLightIndex] : objects[uiState.selectedObject]
            ctx.fillStyle = "#333";
            ctx.fillRect(el.x, el.y, el.width, el.height);
            ctx.fillStyle = "#fff";
              ctx.font = "16px sans-serif";
            let title = uiState.selectedLightIndex > -1 ? `Light ${uiState.selectedLightIndex + 1}` : `${obj.type} ${uiState.selectedObject+1}`
            ctx.fillText(title, el.x + 10, el.y + 20)

           let y = el.y + 40;
               if(uiState.selectedLightIndex > -1 ) {
                   createModalButton(el,  y, 'radius', obj.radius, (val) => obj.radius = parseInt(val), 'number');
                    y += 30;
                   createModalButton(el,  y, 'numRays', obj.numRays, (val) => obj.numRays = parseInt(val), 'number');
                    y += 30;
                   createModalButton(el,  y, 'spreadAngle', obj.spreadAngle, (val) => obj.spreadAngle = parseInt(val), 'number');
                   y+= 30;
                   createModalButton(el, y, 'rayLength', obj.rayLength, (val) => obj.rayLength = parseInt(val), 'number');
                    y+= 30;
                     createModalButton(el, y, 'blur', obj.blur, (val) => obj.blur = parseInt(val), 'number');
                   y+= 30;
                   createModalButton(el,y, 'color', obj.color, (val) => obj.color = val, 'color');

               } else {
                   createModalButton(el, y, 'x', obj.x, (val) => obj.x = parseInt(val), 'number');
                    y += 30;
                  createModalButton(el, y, 'y', obj.y, (val) => obj.y = parseInt(val), 'number');
                  y += 30;
                  if(obj.type === 'segment') {
                      createModalButton(el, y, 'length', obj.length, (val) => obj.length = parseInt(val), 'number');
                        y+= 30
                      createModalButton(el, y, 'hitBox', obj.hitBox, (val) => obj.hitBox = parseInt(val), 'number');
                        y+= 30
                  } else if (obj.type === 'rect') {
                         createModalButton(el, y, 'width', obj.width, (val) => obj.width = parseInt(val), 'number');
                         y += 30
                        createModalButton(el, y, 'height', obj.height, (val) => obj.height = parseInt(val), 'number');
                        y += 30
                     } else if (obj.type === 'arc') {
                        createModalButton(el, y, 'radius', obj.radius, (val) => obj.radius = parseInt(val), 'number');
                        y += 30
                        createModalButton(el, y, 'startAngle', obj.startAngle, (val) => obj.startAngle = parseInt(val), 'number');
                       y += 30
                       createModalButton(el, y, 'endAngle', obj.endAngle, (val) => obj.endAngle = parseInt(val), 'number');
                       y += 30
                    } else {
                       createModalButton(el, y, 'radius', obj.radius, (val) => obj.radius = parseInt(val), 'number');
                        y += 30;
                   }
                 createModalButton(el, y, 'angle', obj.angle, (val) => obj.angle = parseInt(val), 'number');
                    y+= 30;
                   createModalButton(el, y, 'reflect', obj.reflect, (val) => obj.reflect = parseFloat(val), 'number');
                     y+= 30;
                   createModalButton(el, y, 'color', obj.color, (val) => obj.color = val, 'color');
                  y+= 30
                    createModalButton(el, y, 'createScript', 'Create Script', (val) => openScriptModal(obj), 'button');
                  y+= 30;
                   if(obj.scripts && obj.scripts.length > 0) {
                         obj.scripts.forEach((script, index) => {
                             createScriptButton(el, y, script, obj, index);
                              y += 30;
                           });
                    }
                 createModalButton(el, y, 'delete', 'Delete', (val) => deleteObject(), 'button')


               }
           }
    });
}
function createScriptButton(inspector, y, script, obj, index) {
    const buttonRect = {x: inspector.x + 10, y: y, w: 220, h: 20 };
    buttonRect.type = 'script-button';
    buttonRect.text = `${script.name} (${script.enabled ? 'On' : 'Off'})`;
    buttonRect.onClick = () => {
        showScriptModal(obj, script, index);
    };
     uiElements.push(buttonRect);

     ctx.fillStyle = "#fff";
     ctx.font = "14px sans-serif";
      ctx.textAlign = "left";
    ctx.fillText(buttonRect.text, buttonRect.x + 5, buttonRect.y + 15);
      ctx.fillStyle = "white";
      ctx.fillRect(buttonRect.x , buttonRect.y , buttonRect.w, buttonRect.h)
   ctx.fillStyle = "black";
    ctx.fillText(buttonRect.text, buttonRect.x + 5, buttonRect.y + 15)

}
function createModalButton(inspector, y, label, value, onChange, type) {
   ctx.fillStyle = "#fff";
   ctx.font = "14px sans-serif";
   ctx.textAlign = "left";
   ctx.fillText(label, inspector.x + 10, y + 15);
   ctx.fillStyle = "white";
    if(type !== 'button') {
        ctx.fillRect(inspector.x + 70, y, 160, 20);
        ctx.fillStyle = "black";
       ctx.fillText(value, inspector.x + 75, y + 15)
    }

   const buttonRect = {x: inspector.x + 70, y: y, w: 160, h: 20 };
    buttonRect.type = 'modal-button';
   buttonRect.label = label;
    buttonRect.onClick = () => {
        if(type === 'button') {
          onChange();
         } else {
            showModal(label, value, onChange, type, buttonRect)
       }
    }
    uiElements.push(buttonRect);
}


function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
     applyCameraTransform();
    lightSources.forEach(drawLightSource);
    castRays();
    drawObjects();
     resetTransform();
    drawCameraInfo();
    drawUI();
    if(uiState.modal) {
          drawModal();
    }
    if(uiState.scriptModal) {
      drawScriptModal();
    }
    time += 0.02
    requestAnimationFrame(animate);
}


function drawLightSource(source) {
    ctx.fillStyle = source.color;
    ctx.beginPath();
    ctx.arc(source.x, source.y, source.radius, 0, Math.PI * 2);
    ctx.fill();
}


function drawObjects() {
    objects.forEach(object => {
        ctx.save();
         if(uiState.selectedObject === objects.indexOf(object) ) {
             ctx.strokeStyle = 'yellow'
             ctx.lineWidth = 2
          } else {
             ctx.strokeStyle = object.color;
              ctx.lineWidth = 1;
           }
          if(object.type === 'segment') {
            const x1 = object.x - object.length / 2 * Math.cos(object.angle * Math.PI / 180);
            const y1 = object.y - object.length / 2 * Math.sin(object.angle * Math.PI / 180);
            const x2 = object.x + object.length / 2 * Math.cos(object.angle * Math.PI / 180);
            const y2 = object.y + object.length / 2 * Math.sin(object.angle * Math.PI / 180);
             ctx.beginPath();
            ctx.moveTo(x1,y1);
              ctx.lineTo(x2, y2);
            ctx.stroke();
            if(uiState.selectedObject === objects.indexOf(object) ) {
                ctx.beginPath();
                 ctx.rect(x1 - object.hitBox, y1 - object.hitBox, (x2 - x1) + object.hitBox*2, (y2 - y1) + object.hitBox*2);
                   ctx.stroke()
             }
         } else if (object.type === 'circle') {
            ctx.translate(object.x, object.y);
            ctx.rotate(object.angle * Math.PI/180);
            ctx.fillStyle = object.color;
            ctx.beginPath();
            ctx.arc(0, 0, object.radius, 0, Math.PI * 2);
            ctx.fill();
            if(uiState.selectedObject === objects.indexOf(object) ) {
                  ctx.beginPath()
                  ctx.arc(0, 0, object.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            } else if (object.type === 'rect') {
                 ctx.translate(object.x, object.y);
                ctx.rotate(object.angle * Math.PI/180);
               ctx.fillStyle = object.color;
               ctx.fillRect(-object.width / 2, -object.height/2, object.width, object.height)
                if(uiState.selectedObject === objects.indexOf(object) ) {
                     ctx.beginPath();
                     ctx.rect(-object.width / 2, -object.height / 2, object.width, object.height);
                     ctx.stroke();
                }
             } else if (object.type === 'arc') {
                  ctx.translate(object.x, object.y);
                  ctx.rotate(object.angle * Math.PI/180);
                  ctx.beginPath();
                  ctx.arc(0, 0, object.radius, object.startAngle * Math.PI / 180, object.endAngle * Math.PI / 180);
                  ctx.strokeStyle = object.color;
                 ctx.stroke();
                if(uiState.selectedObject === objects.indexOf(object) ) {
                      ctx.beginPath();
                      ctx.arc(0, 0, object.radius, object.startAngle * Math.PI / 180, object.endAngle * Math.PI / 180);
                       ctx.stroke()
                }

              }
          ctx.restore();
         if(object.scripts && object.scripts.length > 0) {
            object.scripts.forEach(script => {
              if(script.enabled && script.code) {
                   try {
                     const sin = Math.sin;
                      const cos = Math.cos;
                        const tan = Math.tan;
                         const random = GameAPI.random;
                       const distance = GameAPI.distance;
                       const move = GameAPI.move;
                        const rotate = GameAPI.rotate;
                        const setColor = GameAPI.setColor
                         const log = GameAPI.log;
                      const getMousePosition = GameAPI.getMousePosition;

                      (function(object, time) {
                         eval(script.code);
                        })(object, time);
                   } catch (e) {
                    console.error('Error on object ', object, e)
                  }
                 }
             });
        }
      });
}


function castRays() {
    lightSources.forEach(lightSource => {
         for (let i = 0; i < lightSource.numRays; i++) {
            const angle = (i / lightSource.numRays) * (lightSource.spreadAngle * Math.PI / 180) - (lightSource.spreadAngle * Math.PI / 360) + (Math.random() - 0.5) * lightSource.blur * Math.PI / 180;
            const ray = {
                start: { x: lightSource.x, y: lightSource.y },
                direction: { x: Math.cos(angle), y: Math.sin(angle) }
            };
           castRay(ray, lightSource, 0)
          }
    });
}
function castRay(ray, lightSource, depth) {
     if (depth > 5) return;
      const intersection = findClosestIntersection(ray);
      ctx.strokeStyle = `rgba(${hexToRgb(lightSource.color).join(', ')}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(ray.start.x, ray.start.y);
       if(intersection) {
            ctx.lineTo(intersection.x, intersection.y);
        } else {
            const end = { x: ray.start.x + ray.direction.x * lightSource.rayLength, y: ray.start.y + ray.direction.y * lightSource.rayLength }
            ctx.lineTo(end.x, end.y);
        }
      ctx.stroke();

       if (intersection && intersection.object.reflect > 0) {
            const normal = getNormal(intersection, ray);
            const reflectDir = {
                x: ray.direction.x - 2 * normal.x * (ray.direction.x * normal.x + ray.direction.y * normal.y),
                y: ray.direction.y - 2 * normal.y * (ray.direction.x * normal.x + ray.direction.y * normal.y)
            }
             const reflectedRay = {
               start: { x: intersection.x, y: intersection.y},
               direction: reflectDir
            }
             castRay(reflectedRay, lightSource, depth+1)
      }
}

function getNormal(intersection, ray) {
    const obj = intersection.object;
    if(obj.type === 'segment') {
        const dx = obj.x + obj.length / 2 * Math.cos(obj.angle * Math.PI / 180) - (obj.x - obj.length / 2 * Math.cos(obj.angle * Math.PI / 180));
       const dy = obj.y + obj.length / 2 * Math.sin(obj.angle * Math.PI / 180) - (obj.y - obj.length / 2 * Math.sin(obj.angle * Math.PI / 180));
          const normal = {x: -dy, y: dx};
            const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
             return {x: normal.x/ length, y: normal.y / length};
    }
    if(obj.type === 'circle') {
        const normal = {x: intersection.x - obj.x, y: intersection.y - obj.y};
        const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        return {x: normal.x / length, y: normal.y / length}
    }
     if(obj.type === 'rect') {
          const normal = {x: intersection.x - obj.x, y: intersection.y - obj.y};
           const rotatedX = normal.x * Math.cos(-obj.angle * Math.PI / 180) - normal.y * Math.sin(-obj.angle * Math.PI / 180);
         const rotatedY = normal.x * Math.sin(-obj.angle * Math.PI / 180) + normal.y * Math.cos(-obj.angle * Math.PI / 180);
        if(Math.abs(rotatedX) > Math.abs(rotatedY)) {
            return {x: Math.sign(rotatedX) * Math.cos(obj.angle * Math.PI/180), y: Math.sign(rotatedX) * Math.sin(obj.angle * Math.PI/180)}
         } else {
             return {x: Math.sign(rotatedY) * Math.cos((obj.angle + 90) * Math.PI / 180) , y: Math.sign(rotatedY) * Math.sin((obj.angle + 90) * Math.PI / 180)}
         }
        }
        if(obj.type === 'arc') {
             const normal = {x: intersection.x - obj.x, y: intersection.y - obj.y};
              const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
              return {x: normal.x / length, y: normal.y / length}
        }
    return {x: 0, y: 0}
}
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0,0,0];
}

function findClosestIntersection(ray) {
    let closestIntersection = null;
    let minDistance = Infinity;

    for (const object of objects) {
        let intersection;
        if(object.type === 'segment') {
            intersection = lineIntersection(ray, object);
        } else if(object.type === 'circle'){
            intersection = circleIntersection(ray, object);
        } else if(object.type === 'rect') {
             intersection = rectIntersection(ray, object)
        } else if (object.type === 'arc') {
             intersection = arcIntersection(ray,object)
        }
        

        if (intersection) {
            const distance = Math.sqrt( (intersection.x - ray.start.x)**2 + (intersection.y - ray.start.y)**2 );
            if(distance < minDistance) {
                minDistance = distance;
                closestIntersection = {...intersection, object: object};
            }
        }
    }

    return closestIntersection;
}


function lineIntersection(ray, line) {
    const x1 = line.x - line.length / 2 * Math.cos(line.angle * Math.PI / 180);
    const y1 = line.y - line.length / 2 * Math.sin(line.angle * Math.PI / 180);
    const x2 = line.x + line.length / 2 * Math.cos(line.angle * Math.PI / 180);
    const y2 = line.y + line.length / 2 * Math.sin(line.angle * Math.PI / 180);

    const x3 = ray.start.x;
    const y3 = ray.start.y;
    const x4 = ray.start.x + ray.direction.x;
    const y4 = ray.start.y + ray.direction.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) { return null; }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

    if (t >= 0 && t <= 1 && u >= 0) {
       return {x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1)};
    }

    return null;
}


function circleIntersection(ray, circle) {
    const cx = circle.x;
    const cy = circle.y;
    const radius = circle.radius;
    const ox = ray.start.x;
    const oy = ray.start.y;
    const dx = ray.direction.x;
    const dy = ray.direction.y;
  
  
     const a = dx * dx + dy * dy;
     const b = 2 * (dx * (ox - cx) + dy * (oy - cy));
     const c = (ox - cx) * (ox - cx) + (oy - cy) * (oy - cy) - radius * radius;
  
    const discriminant = b * b - 4 * a * c;
  
    if (discriminant < 0) {
          return null; 
    }
    
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    let t = Math.min(t1,t2);
    if (t < 0) {
       t = Math.max(t1,t2);
    }

    if (t > 0) {
          return {x: ox + t * dx, y: oy + t * dy};
    }
    return null;
}
function rectIntersection(ray, rect) {
      const rectPoints = [
        { x: rect.x - rect.width / 2, y: rect.y - rect.height / 2 },
        { x: rect.x + rect.width / 2, y: rect.y - rect.height / 2 },
        { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
        { x: rect.x - rect.width / 2, y: rect.y + rect.height / 2 }
      ].map(p => {
        const dx = p.x - rect.x;
        const dy = p.y - rect.y;
       return {
           x: rect.x + dx * Math.cos(rect.angle * Math.PI / 180) - dy * Math.sin(rect.angle * Math.PI / 180),
           y: rect.y + dx * Math.sin(rect.angle * Math.PI / 180) + dy * Math.cos(rect.angle * Math.PI / 180)
       }
      })

     let closestIntersection = null;
     let minDistance = Infinity;


    for(let i = 0; i < 4; i++) {
       const intersection = lineIntersection(ray, {x1: rectPoints[i].x, y1: rectPoints[i].y, x2: rectPoints[(i+1)%4].x, y2: rectPoints[(i+1)%4].y})
         if (intersection) {
           const distance = Math.sqrt((intersection.x - ray.start.x)**2 + (intersection.y - ray.start.y)**2)
           if (distance < minDistance) {
             minDistance = distance;
             closestIntersection = intersection;
          }
        }
   }

    return closestIntersection;

}

function arcIntersection(ray, arc) {
    const cx = arc.x;
    const cy = arc.y;
    const radius = arc.radius;
    const ox = ray.start.x;
    const oy = ray.start.y;
    const dx = ray.direction.x;
    const dy = ray.direction.y;
    
    const a = dx * dx + dy * dy;
    const b = 2 * (dx * (ox - cx) + dy * (oy - cy));
    const c = (ox - cx) * (ox - cx) + (oy - cy) * (oy - cy) - radius * radius;
    
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return null;
    }
    
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    let t = Math.min(t1,t2);
    if (t < 0) {
      t = Math.max(t1,t2)
    }
  
    const intersectionX = ox + t * dx;
    const intersectionY = oy + t * dy;
    const angle = Math.atan2(intersectionY - cy, intersectionX - cx) * 180 / Math.PI;
    const startAngle = arc.startAngle;
    const endAngle = arc.endAngle;

    if (t > 0 && angle >= startAngle && angle <= endAngle) {
      return { x: intersectionX, y: intersectionY };
    }
    return null
}


// Обработчики событий

canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - canvas.width / 2 + cameraX) / cameraScale + canvas.width / 2;
      mouseY = (e.clientY - rect.top - canvas.height / 2 + cameraY) / cameraScale + canvas.height / 2;
   
    if(uiState.isEditingUI) return;
    if (e.button === 0) {
        // Проверка на источник света
         for (let i = 0; i < lightSources.length; i++) {
            const source = lightSources[i];
             const dist = Math.sqrt((mouseX - source.x) ** 2 + (mouseY - source.y) ** 2);
             if (dist < source.radius) {
                 isDraggingLight = true;
                 draggingLightIndex = i;
                 return;
             }
         }
         // Проверка на объект
         for (let i = objects.length - 1; i >= 0; i--) {
             const object = objects[i];
             if (object.type === 'segment') {
                   const x1 = object.x - object.length / 2 * Math.cos(object.angle * Math.PI / 180);
                   const y1 = object.y - object.length / 2 * Math.sin(object.angle * Math.PI / 180);
                   const x2 = object.x + object.length / 2 * Math.cos(object.angle * Math.PI / 180);
                   const y2 = object.y + object.length / 2 * Math.sin(object.angle * Math.PI / 180);
 
                   const dx = mouseX - x1;
                   const dy = mouseY - y1;
                   const rotatedX = dx * Math.cos(-object.angle * Math.PI / 180) - dy * Math.sin(-object.angle * Math.PI / 180);
                   const rotatedY = dx * Math.sin(-object.angle * Math.PI / 180) + dy * Math.cos(-object.angle * Math.PI / 180);
                if (rotatedX >= -object.hitBox && rotatedX <= (x2 - x1) + object.hitBox && rotatedY >= -object.hitBox && rotatedY <= (y2 - y1) + object.hitBox) {
                     isDraggingObject = true;
                     draggingObjectOffsetX = rotatedX;
                     draggingObjectOffsetY = rotatedY;
                     uiState.selectedObject = i;
                     uiState.selectedLightIndex = -1
                    updateUI()
                      return;
                 }
             } else if (object.type === 'rect') {
                  const rectPoints = [
                         { x: object.x - object.width / 2, y: object.y - object.height / 2 },
                         { x: object.x + object.width / 2, y: object.y - object.height / 2 },
                         { x: object.x + object.width / 2, y: object.y + object.height / 2 },
                         { x: object.x - object.width / 2, y: object.y + object.height / 2 }
                       ].map(p => {
                         const dx = p.x - object.x;
                         const dy = p.y - object.y;
                         return {
                            x: object.x + dx * Math.cos(object.angle * Math.PI / 180) - dy * Math.sin(object.angle * Math.PI / 180),
                            y: object.y + dx * Math.sin(object.angle * Math.PI / 180) + dy * Math.cos(object.angle * Math.PI / 180)
                         }
                      })
 
                   const minX = Math.min(rectPoints[0].x, rectPoints[1].x, rectPoints[2].x, rectPoints[3].x);
                     const minY = Math.min(rectPoints[0].y, rectPoints[1].y, rectPoints[2].y, rectPoints[3].y);
                     const maxX = Math.max(rectPoints[0].x, rectPoints[1].x, rectPoints[2].x, rectPoints[3].x);
                     const maxY = Math.max(rectPoints[0].y, rectPoints[1].y, rectPoints[2].y, rectPoints[3].y);
                     if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY ) {
                       isDraggingObject = true;
                       draggingObjectOffsetX = mouseX - object.x;
                       draggingObjectOffsetY = mouseY - object.y;
                       uiState.selectedObject = i;
                       uiState.selectedLightIndex = -1
                     updateUI()
                     return;
                    }
             } else if (object.type === 'arc') {
                    const dist = Math.sqrt((mouseX - object.x) ** 2 + (mouseY - object.y) ** 2);
                     const angle = Math.atan2(mouseY - object.y, mouseX - object.x) * 180 / Math.PI;
                     if (dist < object.radius && angle >= object.startAngle && angle <= object.endAngle) {
                         isDraggingObject = true;
                          draggingObjectOffsetX = mouseX - object.x;
                          draggingObjectOffsetY = mouseY - object.y;
                          uiState.selectedObject = i;
                         uiState.selectedLightIndex = -1
                        updateUI()
                        return;
                 }
              }else {
                 const dist = Math.sqrt((mouseX - object.x) ** 2 + (mouseY - object.y) ** 2);
                 if (dist < object.radius) {
                     isDraggingObject = true;
                     draggingObjectOffsetX = mouseX - object.x;
                     draggingObjectOffsetY = mouseY - object.y;
                     uiState.selectedObject = i;
                     uiState.selectedLightIndex = -1
                     updateUI()
                      return;
                 }
             }
         }
         // Проверка на клик по UI
         for (const element of uiElements) {
             if (element.type === 'button' &&
                 e.offsetX >= element.x && e.offsetX <= element.x + element.width &&
                 e.offsetY >= element.y && e.offsetY <= element.y + element.height) {
                     if(element.onClick) element.onClick(element);
                     updateUI();
                     return;
              }
              if(element.type === 'modal-button' &&
                  e.offsetX >= element.x && e.offsetX <= element.x + element.w &&
                  e.offsetY >= element.y && e.offsetY <= element.y + element.h) {
                  if(element.onClick) element.onClick(element);
                  return;
              }
              if(element.type === 'script-button' &&
                   e.offsetX >= element.x && e.offsetX <= element.x + element.w &&
                  e.offsetY >= element.y && e.offsetY <= element.y + element.h) {
                     if(element.onClick) element.onClick(element);
                     return;
               }
         }
         
 
 
      } else if (e.button === 2) {
             //Проверка на объект для вращения
         for (let i = objects.length - 1; i >= 0; i--) {
             const object = objects[i];
             if (object.type === 'segment') {
                    const x1 = object.x - object.length / 2 * Math.cos(object.angle * Math.PI / 180);
                    const y1 = object.y - object.length / 2 * Math.sin(object.angle * Math.PI / 180);
                    const x2 = object.x + object.length / 2 * Math.cos(object.angle * Math.PI / 180);
                    const y2 = object.y + object.length / 2 * Math.sin(object.angle * Math.PI / 180);
 
                    const dx = mouseX - x1;
                    const dy = mouseY - y1;
                     const rotatedX = dx * Math.cos(-object.angle * Math.PI / 180) - dy * Math.sin(-object.angle * Math.PI / 180);
                      const rotatedY = dx * Math.sin(-object.angle * Math.PI / 180) + dy * Math.cos(-object.angle * Math.PI / 180);
                    if (rotatedX >= -object.hitBox && rotatedX <= (x2 - x1) + object.hitBox && rotatedY >= -object.hitBox && rotatedY <= (y2 - y1) + object.hitBox) {
                         isRotatingObject = true;
                         rotatingObjectCenter = { x: object.x, y: object.y };
                         rotationStartAngle = Math.atan2(mouseY - rotatingObjectCenter.y, mouseX - rotatingObjectCenter.x) - (object.angle * Math.PI / 180);
                            uiState.selectedObject = i;
                             uiState.selectedLightIndex = -1
                         updateUI();
                        return;
                     }
             } else if (object.type === 'rect') {
                 const rectPoints = [
                     { x: object.x - object.width / 2, y: object.y - object.height / 2 },
                     { x: object.x + object.width / 2, y: object.y - object.height / 2 },
                     { x: object.x + object.width / 2, y: object.y + object.height / 2 },
                     { x: object.x - object.width / 2, y: object.y + object.height / 2 }
                     ].map(p => {
                          const dx = p.x - object.x;
                         const dy = p.y - object.y;
                          return {
                             x: object.x + dx * Math.cos(object.angle * Math.PI / 180) - dy * Math.sin(object.angle * Math.PI / 180),
                            y: object.y + dx * Math.sin(object.angle * Math.PI / 180) + dy * Math.cos(object.angle * Math.PI / 180)
                         }
                  })
                const minX = Math.min(rectPoints[0].x, rectPoints[1].x, rectPoints[2].x, rectPoints[3].x);
                 const minY = Math.min(rectPoints[0].y, rectPoints[1].y, rectPoints[2].y, rectPoints[3].y);
                 const maxX = Math.max(rectPoints[0].x, rectPoints[1].x, rectPoints[2].x, rectPoints[3].x);
                  const maxY = Math.max(rectPoints[0].y, rectPoints[1].y, rectPoints[2].y, rectPoints[3].y);
                     if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY ) {
                          isRotatingObject = true;
                             rotatingObjectCenter = { x: object.x, y: object.y };
                              rotationStartAngle = Math.atan2(mouseY - rotatingObjectCenter.y, mouseX - rotatingObjectCenter.x) - (object.angle * Math.PI / 180);
                             uiState.selectedObject = i;
                             uiState.selectedLightIndex = -1
                            updateUI();
                        return;
                    }
             }else if (object.type === 'arc') {
                      const dist = Math.sqrt((mouseX - object.x) ** 2 + (mouseY - object.y) ** 2);
                      const angle = Math.atan2(mouseY - object.y, mouseX - object.x) * 180 / Math.PI;
                         if (dist < object.radius && angle >= object.startAngle && angle <= object.endAngle) {
                               isRotatingObject = true;
                                rotatingObjectCenter = { x: object.x, y: object.y };
                                rotationStartAngle = Math.atan2(mouseY - rotatingObjectCenter.y, mouseX - rotatingObjectCenter.x) - (object.angle * Math.PI / 180);
                              uiState.selectedObject = i;
                               uiState.selectedLightIndex = -1
                                 updateUI();
                             return;
                         }
               } else {
                  const dist = Math.sqrt((mouseX - object.x) ** 2 + (mouseY - object.y) ** 2);
                 if (dist < object.radius) {
                     isRotatingObject = true;
                     rotatingObjectCenter = { x: object.x, y: object.y };
                    rotationStartAngle = Math.atan2(mouseY - rotatingObjectCenter.y, mouseX - rotatingObjectCenter.x) - (object.angle * Math.PI / 180);
                      uiState.selectedObject = i;
                     uiState.selectedLightIndex = -1
                       updateUI();
                    return;
                 }
             }
         }
      } else if (e.button === 1) {
           isDraggingCamera = true;
          cameraDragStartX = e.offsetX;
          cameraDragStartY = e.offsetY;
     }
 });
 
 
 
 canvas.addEventListener('mousemove', (e) => {
     const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - canvas.width / 2 + cameraX) / cameraScale + canvas.width / 2;
      mouseY = (e.clientY - rect.top - canvas.height / 2 + cameraY) / cameraScale + canvas.height / 2;
    
     
     if(uiState.isEditingUI) return;
 
     if (isDraggingLight && draggingLightIndex > -1) {
         lightSources[draggingLightIndex].x = mouseX;
         lightSources[draggingLightIndex].y = mouseY;
      }
     if (isDraggingObject && uiState.selectedObject > -1) {
         const obj = objects[uiState.selectedObject];
          if (obj.type === 'segment') {
              const x1 = mouseX - draggingObjectOffsetX * Math.cos(obj.angle * Math.PI/180) + draggingObjectOffsetY * Math.sin(obj.angle * Math.PI/180);
               const y1 = mouseY - draggingObjectOffsetX * Math.sin(obj.angle * Math.PI/180) - draggingObjectOffsetY * Math.cos(obj.angle * Math.PI/180);
               obj.x = x1;
               obj.y = y1;
           } else {
             obj.x = mouseX - draggingObjectOffsetX;
              obj.y = mouseY - draggingObjectOffsetY;
          }
         updateUI();
     }
         if (isRotatingObject && uiState.selectedObject > -1) {
             const obj = objects[uiState.selectedObject];
             const currentAngle = Math.atan2(mouseY - rotatingObjectCenter.y, mouseX - rotatingObjectCenter.x) - rotationStartAngle;
            obj.angle = currentAngle * 180 / Math.PI;
            updateUI()
       }
      if (isDraggingCamera) {
           cameraX += e.offsetX - cameraDragStartX;
           cameraY += e.offsetY - cameraDragStartY;
          cameraDragStartX = e.offsetX;
          cameraDragStartY = e.offsetY;
      }
   
 });
 
 canvas.addEventListener('mouseup', () => {
     isDraggingLight = false;
     draggingLightIndex = -1;
     isDraggingObject = false;
     isRotatingObject = false;
     isDraggingCamera = false;
     uiState.isEditingUI = false;
 });
 
 canvas.addEventListener('wheel', (e) => {
     const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
     cameraScale *= scaleFactor;
 });
 
 canvas.addEventListener('keydown', (e) => {
     if (e.key === 'Escape') {
         uiState.selectedObject = -1;
          uiState.selectedLightIndex = -1;
        updateUI()
         closeModal();
          closeScriptModal();
     }
    if(e.key === 'Enter') {
        closeModal();
         closeScriptModal();
    }
 
     if(e.key === 'Delete' && uiState.selectedObject > -1) {
        objects.splice(uiState.selectedObject, 1);
        uiState.selectedObject = -1;
        updateUI();
     }
     if (e.key === 'Delete' && uiState.modal ) {
         closeModal();
     }
      if (e.key === 'Delete' && uiState.scriptModal ) {
          closeScriptModal();
      }
 });
 
 
 canvas.addEventListener('contextmenu', (e) => {
   e.preventDefault();
 });
 
 function updateLightSources(count) {
   while(lightSources.length < count) {
       lightSources.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            radius: 10, color: "#ffffff", numRays: 100, spreadAngle: 360, rayLength: 1000, blur: 0
           });
   }
   while(lightSources.length > count) {
       lightSources.pop();
   }
     createUI();
 }
 function deleteObject() {
     objects.splice(uiState.selectedObject, 1);
       uiState.selectedObject = -1;
         updateUI();
        closeModal();
 }
 function showModal(label, value, onChange, type, element) {
     uiState.isEditingUI = true;
   uiState.modal = { label, value, onChange, type, element};
 
    const modalDiv = document.createElement('div');
     modalDiv.classList.add('modal');
 
     const labelElement = document.createElement('label');
     labelElement.textContent = label;
     modalDiv.appendChild(labelElement);
 
 
      const inputElement = document.createElement('input');
     inputElement.type = type === 'color' ? 'color' : type === 'number' ? 'number' : 'text';
       inputElement.value = value;
       modalInput = inputElement;
 
      modalDiv.appendChild(inputElement);
 
      const okButton = document.createElement('button');
       okButton.textContent = 'OK';
      okButton.onclick = () => {
          uiState.modal.onChange(type === 'color' ? inputElement.value :  inputElement.value);
         closeModal();
      };
      modalDiv.appendChild(okButton);
 
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.onclick = () => closeModal();
      modalDiv.appendChild(cancelButton);
     document.body.appendChild(modalDiv);
 
     modalDiv.style.top = element.y +  'px';
     modalDiv.style.left = element.x +  'px';
 }
 
 function closeModal() {
   if(uiState.modal) {
       const modalDiv = document.querySelector('.modal');
         if (modalDiv) {
            modalDiv.remove();
            uiState.modal = null;
            modalInput = null;
            uiState.isEditingUI = false;
        }
 
   }
 }
 function drawModal() {
   if(uiState.modal) {
       ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
       ctx.fillRect(0, 0, canvas.width, canvas.height);
     }
 }
 function openScriptModal(obj) {
     uiState.isEditingUI = true;
       uiState.scriptModal = {obj}
     const modalDiv = document.createElement('div');
     modalDiv.classList.add('modal');
      const labelElement = document.createElement('label');
     labelElement.textContent = 'Script Name:';
     modalDiv.appendChild(labelElement);
      const nameInput = document.createElement('input');
     nameInput.type = 'text';
     nameInput.value = '';
     modalDiv.appendChild(nameInput);
     const codeElement = document.createElement('label');
     codeElement.textContent = 'Script code:';
     modalDiv.appendChild(codeElement);
      const textarea = document.createElement('textarea');
      modalDiv.appendChild(textarea);
     const okButton = document.createElement('button');
       okButton.textContent = 'OK';
      okButton.onclick = () => {
         obj.scripts.push({name: nameInput.value, code: textarea.value, enabled: true})
         closeScriptModal()
          updateUI()
      };
      modalDiv.appendChild(okButton);
 
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.onclick = () => closeScriptModal();
      modalDiv.appendChild(cancelButton);
     document.body.appendChild(modalDiv);
 
   const el = uiElements.find(el => el.type === 'inspector')
     modalDiv.style.top = el.y +  'px';
    modalDiv.style.left = el.x +  'px';
 }
 
 function showScriptModal(obj, script, index) {
     uiState.isEditingUI = true;
       uiState.scriptModal = {obj, script, index}
     currentScript = script;
     const modalDiv = document.createElement('div');
     modalDiv.classList.add('modal');
      const labelElement = document.createElement('label');
     labelElement.textContent = 'Script Name:';
     modalDiv.appendChild(labelElement);
      const nameInput = document.createElement('input');
     nameInput.type = 'text';
     nameInput.value = script.name;
      modalDiv.appendChild(nameInput);
     const codeElement = document.createElement('label');
     codeElement.textContent = 'Script code:';
     modalDiv.appendChild(codeElement);
      const textarea = document.createElement('textarea');
      textarea.value = script.code
      modalDiv.appendChild(textarea);
     const okButton = document.createElement('button');
       okButton.textContent = 'Save';
      okButton.onclick = () => {
          script.code = textarea.value;
            script.name = nameInput.value;
          closeScriptModal()
          updateUI()
      };
      modalDiv.appendChild(okButton);
       const toggleButton = document.createElement('button');
      toggleButton.textContent = script.enabled ? 'Disable' : 'Enable';
      toggleButton.onclick = () => {
        script.enabled = !script.enabled;
        closeScriptModal()
          updateUI();
      };
      modalDiv.appendChild(toggleButton);
       const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = () => {
          obj.scripts.splice(index,1);
            closeScriptModal()
          updateUI();
      };
      modalDiv.appendChild(deleteButton);
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.onclick = () => closeScriptModal();
      modalDiv.appendChild(cancelButton);
     document.body.appendChild(modalDiv);
 
       const el = uiElements.find(el => el.type === 'inspector')
     modalDiv.style.top = el.y +  'px';
     modalDiv.style.left = el.x +  'px';
 }
 function closeScriptModal() {
   if(uiState.scriptModal) {
       const modalDiv = document.querySelector('.modal');
         if (modalDiv) {
            modalDiv.remove();
            uiState.scriptModal = null;
            currentScript = null;
            uiState.isEditingUI = false;
        }
 
   }
 }
 function drawScriptModal() {
   if(uiState.scriptModal) {
       ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
       ctx.fillRect(0, 0, canvas.width, canvas.height);
     }
 }
 // Инициализация и запуск анимации
 resizeCanvas();
 createUI();
 animate();
 
 window.addEventListener('resize', resizeCanvas);

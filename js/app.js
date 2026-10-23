/*
 * ============================================================
 * PROYECTO: TASKFLOW
 * Gestión interactiva de tareas mediante eventos JavaScript
 * ============================================================
 *
 * En este archivo trabajaremos:
 *
 * - Manipulación del DOM.
 * - Arrays y objetos.
 * - Funciones y funciones flecha.
 * - Eventos de formulario.
 * - Eventos de ratón, teclado y puntero.
 * - Delegación de eventos.
 * - Captura y burbujeo.
 * - Objeto event.
 * - Eventos personalizados.
 * - Optimización mediante debounce y throttle.
 * - Registro y eliminación de manejadores.
 */


// ------------------------------------------------------------
// MODO ESTRICTO DE JAVASCRIPT
// ------------------------------------------------------------

// Activa el modo estricto.
//
// Este modo obliga a seguir determinadas reglas más rigurosas
// del lenguaje JavaScript.
//
// Por ejemplo, impide asignar valores a variables que no
// hayan sido declaradas previamente.
//
// Sin 'use strict', algunos errores podrían pasar inadvertidos.
//
// Ejemplo incorrecto:
//
// numero = 10;
//
// En modo estricto, esa instrucción produce un ReferenceError
// si numero no se ha declarado anteriormente.

'use strict';


// ------------------------------------------------------------
// FUNCIÓN AUXILIAR PARA SELECCIONAR ELEMENTOS HTML
// ------------------------------------------------------------

// Creamos una función flecha que recibe un selector CSS.
//
// document.querySelector(selector) busca en el documento HTML
// el PRIMER elemento que coincida con el selector recibido.
//
// El símbolo $ es simplemente el nombre que hemos decidido
// utilizar para esta función.
//
// No es una función especial de JavaScript ni necesita jQuery.
//
// Ejemplos:
//
// $('#titulo')      equivale a document.querySelector('#titulo')
//
// $('.tarea')       busca el primer elemento con clase tarea.
//
// $('button')       busca el primer botón del documento.
//
// Si no encuentra ningún elemento, devuelve null.
//
// IMPORTANTE:
// El archivo JavaScript se carga con defer en el HTML.
// De esta manera, cuando se ejecuta, el navegador ya ha
// construido el DOM y podemos localizar sus elementos.

const $ = selector => document.querySelector(selector);


// ------------------------------------------------------------
// ARRAY INICIAL DE TAREAS
// ------------------------------------------------------------

// Declaramos un array llamado tareas.
//
// Cada posición contiene un objeto JavaScript.
//
// Los objetos representan tareas y almacenan cuatro propiedades:
//
// id:
// Identificador numérico único de cada tarea.
//
// titulo:
// Texto descriptivo de la tarea.
//
// prioridad:
// Nivel de importancia: alta, media o baja.
//
// estado:
// Situación actual de la tarea:
// pendiente, en-proceso o completada.
//
// Utilizamos const porque no vamos a sustituir la referencia
// del array por otro array diferente.
//
// Sin embargo, podemos modificar su contenido mediante
// push(), splice() o modificando sus objetos.

const tareas = [

    {
        id: 1,
        titulo: 'Preparar documentación',
        prioridad: 'alta',
        estado: 'pendiente'
    },

    {
        id: 2,
        titulo: 'Revisar página web',
        prioridad: 'media',
        estado: 'en-proceso'
    },

    {
        id: 3,
        titulo: 'Enviar presupuesto',
        prioridad: 'baja',
        estado: 'completada'
    }

];


// ------------------------------------------------------------
// VARIABLES DE ESTADO DE LA APLICACIÓN
// ------------------------------------------------------------

// Guarda el identificador que se asignará a la siguiente tarea.
//
// Como ya existen tareas con ID 1, 2 y 3, comenzamos en 4.
//
// Cada vez que creemos una tarea utilizaremos siguienteId++.
//
// El operador ++ devuelve el valor actual y después lo
// incrementa en una unidad.
//
// Por ejemplo:
//
// id: siguienteId++
//
// La primera vez asigna 4 y después siguienteId pasa a 5.

let siguienteId = 4;


// Almacena el texto que está utilizando el usuario
// para filtrar o buscar tareas.
//
// Inicialmente es una cadena vacía, lo que significa
// que no existe ningún filtro de búsqueda activo.

let busqueda = '';


// Guardará una instancia de AbortController.
//
// AbortController permite cancelar conjuntamente
// varios manejadores de eventos registrados con
// la misma señal.
//
// Inicialmente vale null porque el seguimiento
// del puntero está desactivado.

let seguimiento = null;


// ------------------------------------------------------------
// ESTADOS POSIBLES DE UNA TAREA
// ------------------------------------------------------------

// Array que contiene los estados válidos.
//
// El ORDEN es importante:
//
// Índice 0: pendiente
// Índice 1: en-proceso
// Índice 2: completada
//
// Este orden permitirá mover las tareas hacia delante
// o hacia atrás utilizando operaciones con índices.
//
// Ejemplo:
//
// estados[0] -> 'pendiente'
// estados[1] -> 'en-proceso'
// estados[2] -> 'completada'
//
// Si una tarea está en el índice 0 y queremos avanzar,
// calcularemos el índice 0 + 1.
//
// Si está en el índice 2 y queremos retroceder,
// calcularemos el índice 2 - 1.

const estados = [
    'pendiente',
    'en-proceso',
    'completada'
];

// ------------------------------------------------------------
// FUNCIÓN PARA MOSTRAR MENSAJES AL USUARIO
// ------------------------------------------------------------

// Recibe un texto y lo muestra en el elemento HTML
// cuyo identificador es mensaje.
//
// Utilizamos textContent porque queremos insertar texto,
// no interpretar etiquetas HTML.
//
// Ejemplo:
//
// avisar('Tarea añadida');
//
// Equivale a:
//
// document.querySelector('#mensaje').textContent =
//     'Tarea añadida';
//
// Esta función centraliza la comunicación con el usuario.

function avisar(texto) {

    $('#mensaje').textContent = texto;

}


// ------------------------------------------------------------
// FUNCIÓN DEBOUNCE
// ------------------------------------------------------------

// debounce es una técnica de optimización.
//
// Se utiliza cuando un evento puede producirse muchas veces
// en un intervalo muy corto.
//
// Ejemplo:
// El evento input se ejecuta cada vez que el usuario
// modifica el contenido de un campo.
//
// Si realizamos una búsqueda en cada pulsación,
// podemos ejecutar muchas operaciones innecesarias.
//
// debounce espera hasta que el usuario deja de generar
// eventos durante un tiempo determinado.
//
// Parámetros:
//
// fn:
// Función que queremos ejecutar.
//
// ms:
// Tiempo de espera expresado en milisegundos.
//
// 300 ms = 0,3 segundos.
//
// Esta función devuelve OTRA función.
//
// Es un ejemplo de función de orden superior.

function debounce(fn, ms) {

    // Almacena el identificador del temporizador.
    //
    // Esta variable pertenece al ámbito de debounce.
    //
    // La función que devolvemos seguirá teniendo acceso
    // a ella incluso después de finalizar debounce.
    //
    // Esto es posible gracias a un closure o clausura.

    let id;

    // Devolvemos una función flecha.
    //
    // ...args es un parámetro rest.
    //
    // Permite recibir cualquier número de argumentos
    // y agruparlos en un array.
    //
    // En nuestro caso, normalmente recibirá el objeto event.

    return (...args) => {

        // Cancela el temporizador anterior si todavía
        // estaba pendiente.
        //
        // Así evitamos que se ejecute una búsqueda
        // correspondiente a una pulsación anterior.

        clearTimeout(id);

        // Creamos un nuevo temporizador.
        //
        // setTimeout recibe:
        //
        // 1. La función que debe ejecutar.
        // 2. El tiempo que debe esperar.
        //
        // Cuando transcurran ms milisegundos sin que
        // se produzca otro evento, se ejecutará fn.
        //
        // fn(...args) transmite a la función original
        // los argumentos recibidos.

        id = setTimeout(() => fn(...args), ms);

    };

}


// ------------------------------------------------------------
// FUNCIÓN THROTTLE
// ------------------------------------------------------------

// throttle también sirve para optimizar eventos frecuentes,
// pero funciona de forma diferente a debounce.
//
// debounce:
// Espera a que termine la actividad.
//
// throttle:
// Permite ejecutar una función como máximo una vez
// por cada intervalo de tiempo.
//
// Ejemplo:
//
// Si resize se dispara 100 veces en un segundo
// y utilizamos throttle con 200 ms,
// nuestra función se ejecutará como máximo
// aproximadamente 5 veces durante ese segundo.
//
// Parámetros:
//
// fn: función que queremos controlar.
// ms: intervalo mínimo entre ejecuciones.

function throttle(fn, ms) {

    // Almacena el instante de la última ejecución.
    //
    // Inicialmente vale cero porque todavía
    // no se ha ejecutado la función.

    let ultimo = 0;

    // Devolvemos la función que actuará como intermediaria
    // entre el evento y la función original.

    return (...args) => {

        // Date.now() devuelve el número de milisegundos
        // transcurridos desde el 1 de enero de 1970 UTC.
        //
        // Nos sirve para comparar instantes de tiempo.

        const ahora = Date.now();

        // Calculamos cuánto tiempo ha pasado desde
        // la última ejecución.
        //
        // Si ha transcurrido al menos el intervalo
        // indicado, permitimos ejecutar la función.

        if (ahora - ultimo >= ms) {

            // Actualizamos el instante de ejecución.

            ultimo = ahora;

            // Ejecutamos la función original
            // transmitiéndole sus argumentos.

            fn(...args);

        }

    };

}

function notificarCambio() {

  const total = tareas.length;

  const tareasNoCompletadas = tareas.filter(
    t => t.estado !== 'completada'
  );

  $('#tablero').dispatchEvent(new CustomEvent ( 'tareas:cambiadas', { bubbles: true, 

    detail: {
      total: total,
      noCompletadas: tareasNoCompletadas
    }


     }  )    )
}




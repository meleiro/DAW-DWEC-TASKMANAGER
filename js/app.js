/*
 * ============================================================
 * PROYECTO: TASKFLOW
 * Gestión interactiva de tareas mediante eventos JavaScript
 * ============================================================
 *
 * FUNCIONALIDADES:
 *
 * 1. Crear tareas mediante un formulario.
 * 2. Organizar tareas en tres estados:
 *      - Pendiente
 *      - En proceso
 *      - Completada
 * 3. Mover tareas entre estados.
 * 4. Eliminar tareas.
 * 5. Filtrar tareas por prioridad.
 * 6. Buscar tareas por su título.
 * 7. Realizar búsquedas sin distinguir mayúsculas ni tildes.
 * 8. Utilizar delegación de eventos.
 * 9. Emitir y escuchar eventos personalizados.
 * 10. Optimizar eventos frecuentes con debounce y throttle.
 *
 * CONCEPTOS DE JAVASCRIPT:
 *
 * - Variables const y let.
 * - Arrays y objetos.
 * - Funciones tradicionales y funciones flecha.
 * - Manipulación del DOM.
 * - addEventListener().
 * - Objeto event.
 * - event.target y event.currentTarget.
 * - Métodos closest() y contains().
 * - Operadores lógicos.
 * - Métodos de arrays.
 * - Atributos data-* y dataset.
 * - Temporizadores.
 * - Closures o clausuras.
 * - CustomEvent y dispatchEvent().
 */


// ============================================================
// 1. CONFIGURACIÓN INICIAL
// ============================================================

/*
 * Activamos el modo estricto de JavaScript.
 *
 * Este modo ayuda a detectar determinados errores.
 *
 * Por ejemplo, impide asignar un valor a una variable
 * que no se haya declarado previamente.
 *
 * numero = 10;
 *
 * La instrucción anterior produciría un ReferenceError
 * si la variable numero no existe.
 */

'use strict';


/*
 * Función auxiliar para seleccionar elementos del DOM.
 *
 * Recibe un selector CSS y devuelve el primer elemento
 * del documento que coincida con él.
 *
 * El símbolo $ es simplemente el nombre de la función.
 * No estamos utilizando jQuery.
 *
 * Ejemplos:
 *
 * $('#titulo')
 *    Busca el elemento con id="titulo".
 *
 * $('.tarea')
 *    Busca el primer elemento con class="tarea".
 *
 * $('button')
 *    Busca el primer botón del documento.
 *
 * Si no encuentra ningún elemento, devuelve null.
 *
 * El archivo JavaScript debe cargarse cuando los elementos
 * HTML estén disponibles, por ejemplo mediante defer:
 *
 * <script src="app.js" defer></script>
 */

const $ = selector => document.querySelector(selector);


// ============================================================
// 2. DATOS INICIALES
// ============================================================

/*
 * Array que almacena todas las tareas de la aplicación.
 *
 * Cada elemento del array es un objeto JavaScript.
 *
 * Cada tarea contiene:
 *
 * id:
 *    Identificador numérico único.
 *
 * titulo:
 *    Descripción de la tarea.
 *
 * prioridad:
 *    Puede ser alta, media o baja.
 *
 * estado:
 *    Puede ser pendiente, en-proceso o completada.
 *
 * Utilizamos const porque no vamos a sustituir el array
 * por otro diferente.
 *
 * Sin embargo, sí podemos modificar su contenido:
 *
 * tareas.push(...)
 * tareas.splice(...)
 * tareas[0].estado = ...
 */

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


/*
 * Identificador que recibirá la próxima tarea.
 *
 * Como ya existen las tareas 1, 2 y 3,
 * comenzamos con el identificador 4.
 *
 * Utilizaremos:
 *
 * id: siguienteId++
 *
 * El operador ++ devuelve el valor actual
 * y después incrementa la variable.
 *
 * Primera ejecución:
 *    Se asigna el ID 4.
 *    siguienteId pasa a valer 5.
 */

let siguienteId = 4;


/*
 * Variable que almacena el texto de búsqueda.
 *
 * Inicialmente es una cadena vacía.
 *
 * Cuando busqueda está vacía, todas las tareas
 * cumplen el filtro de texto, porque:
 *
 * 'cualquier texto'.includes('') === true
 */

let busqueda = '';


/*
 * Variable preparada para almacenar un AbortController.
 *
 * AbortController permite cancelar manejadores de eventos
 * registrados utilizando una misma señal.
 *
 * Por ejemplo:
 *
 * seguimiento = new AbortController();
 *
 * elemento.addEventListener('pointermove', funcion, {
 *     signal: seguimiento.signal
 * });
 *
 * seguimiento.abort();
 *
 * Esta variable queda disponible para funcionalidades
 * relacionadas con el seguimiento del puntero.
 */

let seguimiento = null;


/*
 * Array que define los estados posibles de una tarea.
 *
 * El orden de los elementos es importante:
 *
 * Índice 0: pendiente
 * Índice 1: en-proceso
 * Índice 2: completada
 *
 * Este orden permite desplazar tareas utilizando
 * operaciones con los índices.
 *
 * Por ejemplo:
 *
 * estados[0] -> 'pendiente'
 * estados[1] -> 'en-proceso'
 * estados[2] -> 'completada'
 *
 * Para avanzar:
 *    indiceActual + 1
 *
 * Para retroceder:
 *    indiceActual - 1
 */

const estados = [
    'pendiente',
    'en-proceso',
    'completada'
];


// ============================================================
// 3. FUNCIONES AUXILIARES
// ============================================================

/*
 * Muestra un mensaje al usuario.
 *
 * Parámetro:
 *    texto: mensaje que queremos mostrar.
 *
 * Localiza el elemento HTML con id="mensaje"
 * y modifica su propiedad textContent.
 *
 * textContent inserta texto sin interpretar
 * etiquetas HTML.
 *
 * Ejemplo:
 *
 * avisar('Tarea añadida correctamente');
 */

function avisar(texto) {

    $('#mensaje').textContent = texto;

}


/*
 * Normaliza una cadena para realizar búsquedas.
 *
 * Objetivo:
 *
 * Permitir que las búsquedas no distingan entre:
 *
 * - Mayúsculas y minúsculas.
 * - Vocales acentuadas y no acentuadas.
 * - Espacios al principio o al final.
 *
 * Ejemplos:
 *
 * "PROGRAMACIÓN" -> "programacion"
 * "Gestión"      -> "gestion"
 * "EXÁMENES"     -> "examenes"
 *
 * La letra ñ conserva su identidad.
 *
 * Por tanto:
 *
 * "año" -> "año"
 * "ano" -> "ano"
 *
 * Son cadenas diferentes.
 *
 * PASO 1:
 *
 * Convertimos las letras ñ y Ñ en caracteres
 * temporales del área de uso privado de Unicode.
 *
 * Esto evita que normalize("NFD") separe
 * la letra ñ en una n y una marca de tilde.
 *
 * PASO 2:
 *
 * normalize("NFD") descompone los caracteres
 * acentuados.
 *
 * Por ejemplo:
 *
 * "á" -> "a" + marca de acento
 *
 * PASO 3:
 *
 * replace() elimina las marcas combinantes.
 *
 * La expresión regular:
 *
 * /[\u0300-\u036f]/g
 *
 * identifica las marcas Unicode comprendidas
 * en ese intervalo.
 *
 * La bandera g significa que se reemplazan
 * todas las coincidencias.
 *
 * PASO 4:
 *
 * Recuperamos la letra ñ.
 *
 * PASO 5:
 *
 * Convertimos a minúsculas y eliminamos
 * los espacios exteriores.
 *
 * Los caracteres temporales elegidos se reservan
 * para este procesamiento y no deben utilizarse
 * como texto ordinario de las tareas.
 */

function normalizarTexto(texto) {

    return texto

        // Protegemos la letra ñ.
        .replace(/ñ/g, '\uE000')
        .replace(/Ñ/g, '\uE001')

        // Descomponemos los caracteres acentuados.
        .normalize('NFD')

        // Eliminamos las marcas de acentuación.
        .replace(/[\u0300-\u036f]/g, '')

        // Recuperamos la letra ñ.
        .replace(/\uE000/g, 'ñ')
        .replace(/\uE001/g, 'ñ')

        // Convertimos el texto a minúsculas.
        .toLocaleLowerCase('es')

        // Eliminamos espacios al principio y al final.
        .trim();

}


// ============================================================
// 4. OPTIMIZACIÓN DE EVENTOS: DEBOUNCE
// ============================================================

/*
 * debounce controla la frecuencia con la que
 * se ejecuta una función.
 *
 * Se utiliza especialmente con eventos que pueden
 * producirse muchas veces en poco tiempo.
 *
 * Por ejemplo:
 *
 * - input
 * - keyup
 * - resize
 *
 * Cuando el usuario escribe en un buscador,
 * el evento input se dispara con cada cambio.
 *
 * Si ejecutamos renderizar() inmediatamente,
 * podríamos actualizar la interfaz muchas veces.
 *
 * debounce espera a que transcurra un intervalo
 * sin nuevas llamadas antes de ejecutar la función.
 *
 * Ejemplo:
 *
 * El usuario escribe:
 *
 * p
 * pr
 * pro
 * prog
 *
 * Si continúa escribiendo antes de que pasen 300 ms,
 * se cancela la ejecución anterior.
 *
 * Cuando deja de escribir durante 300 ms,
 * se ejecuta la búsqueda.
 *
 * PARÁMETROS:
 *
 * fn:
 *    Función cuya ejecución queremos retrasar.
 *
 * ms:
 *    Tiempo de espera en milisegundos.
 *
 * DEVUELVE:
 *
 * Otra función que controla cuándo se ejecuta fn.
 *
 * Se trata de una función de orden superior:
 * recibe una función y devuelve otra función.
 */

function debounce(fn, ms) {

    /*
     * Almacenamos el identificador del temporizador.
     *
     * Esta variable conserva su valor entre llamadas
     * a la función que devolvemos.
     *
     * Esto es posible gracias a una clausura o closure.
     */

    let id;

    /*
     * Devolvemos una función flecha.
     *
     * ...args es un parámetro rest.
     *
     * Permite recoger los argumentos recibidos
     * en un array.
     *
     * Por ejemplo:
     *
     * funcion('hola', 10)
     *
     * args contendría:
     *
     * ['hola', 10]
     */

    return (...args) => {

        /*
         * Cancelamos el temporizador anterior.
         *
         * Si todavía no había transcurrido el tiempo
         * de espera, su función no llegará a ejecutarse.
         */

        clearTimeout(id);

        /*
         * Creamos un nuevo temporizador.
         *
         * setTimeout recibe:
         *
         * 1. Una función que debe ejecutarse.
         * 2. Un tiempo de espera en milisegundos.
         *
         * fn(...args) utiliza el operador spread
         * para transmitir los argumentos originales.
         *
         * setTimeout no garantiza una ejecución
         * exactamente en el milisegundo indicado:
         * la función se ejecutará cuando el navegador
         * pueda atenderla después de la espera.
         */

        id = setTimeout(() => {

            fn(...args);

        }, ms);

    };

}


// ============================================================
// 5. OPTIMIZACIÓN DE EVENTOS: THROTTLE
// ============================================================

/*
 * throttle limita la frecuencia de ejecución
 * de una función.
 *
 * Se diferencia de debounce:
 *
 * debounce:
 *    Espera a que termine la actividad.
 *
 * throttle:
 *    Permite ejecutar periódicamente mientras
 *    continúa la actividad.
 *
 * Ejemplo:
 *
 * Si un evento se dispara 100 veces por segundo,
 * throttle puede limitar su ejecución a una vez
 * cada 200 milisegundos.
 *
 * Resulta útil para:
 *
 * - resize
 * - scroll
 * - pointermove
 *
 * PARÁMETROS:
 *
 * fn:
 *    Función que queremos ejecutar.
 *
 * ms:
 *    Intervalo mínimo entre ejecuciones.
 *
 * Esta implementación ejecuta inmediatamente
 * la primera llamada permitida y descarta
 * las llamadas que se produzcan durante
 * el intervalo de espera.
 */

function throttle(fn, ms) {

    /*
     * Guardamos el instante de la última ejecución.
     *
     * Inicialmente vale cero.
     */

    let ultimo = 0;

    /*
     * Devolvemos una función que recibe los argumentos
     * originales y controla la ejecución.
     */

    return (...args) => {

        /*
         * Date.now() devuelve el número de milisegundos
         * transcurridos desde el 1 de enero de 1970 UTC.
         */

        const ahora = Date.now();

        /*
         * Calculamos el tiempo transcurrido desde
         * la última ejecución.
         *
         * Si ha pasado el intervalo mínimo,
         * permitimos ejecutar la función.
         */

        if (ahora - ultimo >= ms) {

            // Guardamos el instante actual.
            ultimo = ahora;

            // Ejecutamos la función original.
            fn(...args);

        }

    };

}


// ============================================================
// 6. EVENTOS PERSONALIZADOS
// ============================================================

/*
 * Esta función comunica que el conjunto de tareas
 * ha cambiado o que el tablero se ha actualizado.
 *
 * Para ello utilizamos CustomEvent.
 *
 * Un evento personalizado es un evento definido
 * por nuestra aplicación.
 *
 * No necesitamos limitarnos a los eventos nativos
 * del navegador, como click, input o submit.
 *
 * Nombre del evento:
 *
 * 'tareas:cambiadas'
 *
 * La propiedad detail permite transmitir
 * información adicional.
 *
 * En nuestro caso:
 *
 * total:
 *    Número total de tareas.
 *
 * noCompletadas:
 *    Número de tareas cuyo estado no es completada.
 */

function notificarCambio() {

    /*
     * Obtenemos el número total de tareas.
     */

    const total = tareas.length;

    /*
     * filter() crea un nuevo array con los elementos
     * que cumplen una condición.
     *
     * En este caso, seleccionamos las tareas cuyo
     * estado es diferente de completada.
     *
     * !== significa estrictamente distinto.
     */

    const tareasNoCompletadas = tareas.filter(
        tarea => tarea.estado !== 'completada'
    );

    /*
     * Creamos un evento personalizado.
     *
     * bubbles: true
     *
     * Permite que el evento se propague desde
     * el tablero hacia sus elementos antecesores.
     *
     * detail:
     *
     * Contiene los datos que queremos comunicar.
     */

    const evento = new CustomEvent('tareas:cambiadas', {

        bubbles: true,

        detail: {
            total: total,
            noCompletadas: tareasNoCompletadas.length
        }

    });

    /*
     * dispatchEvent() lanza el evento.
     *
     * Lo lanzamos desde #tablero.
     *
     * Los listeners registrados para este evento
     * podrán reaccionar y consultar event.detail.
     */

    $('#tablero').dispatchEvent(evento);

}


/*
 * Registramos un listener para escuchar
 * el evento personalizado.
 *
 * El listener está colocado en document.
 *
 * Como el evento se lanza desde #tablero
 * con bubbles: true, puede propagarse
 * hasta document.
 *
 * event.type:
 *    Nombre del evento.
 *
 * event.detail:
 *    Información adicional que enviamos.
 */

document.addEventListener('tareas:cambiadas', event => {

   $('#estadisticas').textContent = 
      `Total: ${event.detail.total} - ` +
      `Sin completar:  ${event.detail.noCompletadas}`;

});


// ============================================================
// 7. RENDERIZACIÓN DEL TABLERO
// ============================================================

/*
 * renderizar() es una de las funciones principales
 * de la aplicación.
 *
 * Su responsabilidad es actualizar el contenido
 * visual del tablero.
 *
 * PROCESO:
 *
 * 1. Vaciar las columnas.
 * 2. Obtener el filtro de prioridad.
 * 3. Recorrer las tareas.
 * 4. Aplicar los filtros.
 * 5. Crear las tarjetas HTML.
 * 6. Crear los botones de acción.
 * 7. Insertar las tarjetas en sus columnas.
 * 8. Emitir un evento personalizado.
 *
 * IMPORTANTE:
 *
 * Esta función no elimina tareas del array
 * cuando no cumplen los filtros.
 *
 * Simplemente decide qué tareas se representan
 * en el documento HTML.
 */

function renderizar() {

    // --------------------------------------------------------
    // 7.1. LIMPIAR LAS COLUMNAS
    // --------------------------------------------------------

    /*
     * Recorremos los estados posibles.
     *
     * Para cada estado localizamos su contenedor HTML.
     *
     * Ejemplo:
     *
     * estado = 'pendiente'
     *
     * '#' + estado
     *
     * produce:
     *
     * '#pendiente'
     *
     * replaceChildren() elimina todos los nodos hijos
     * del contenedor.
     *
     * Esto evita duplicar las tarjetas cada vez
     * que se actualiza el tablero.
     */

    for (const estado of estados) {

        $('#' + estado).replaceChildren();

    }


    // --------------------------------------------------------
    // 7.2. OBTENER EL FILTRO DE PRIORIDAD
    // --------------------------------------------------------

    /*
     * Leemos el valor seleccionado en el desplegable.
     *
     * Posibles valores:
     *
     * todas
     * alta
     * media
     * baja
     *
     * Si el usuario selecciona todas,
     * no descartaremos ninguna tarea por prioridad.
     */

    const filtro = $('#filtro').value;


    // --------------------------------------------------------
    // 7.3. RECORRER TODAS LAS TAREAS
    // --------------------------------------------------------

    /*
     * for...of permite recorrer los elementos
     * de un array.
     *
     * En cada iteración, tarea contiene uno
     * de los objetos del array tareas.
     */

    for (const tarea of tareas) {


        // ----------------------------------------------------
        // 7.4. FILTRAR POR PRIORIDAD
        // ----------------------------------------------------

        /*
         * Comprobamos dos condiciones:
         *
         * filtro !== 'todas'
         *
         * El usuario ha seleccionado una prioridad concreta.
         *
         * tarea.prioridad !== filtro
         *
         * La prioridad de la tarea no coincide
         * con la seleccionada.
         *
         * && es el operador AND lógico.
         *
         * Ambas condiciones deben cumplirse para
         * entrar en el if.
         *
         * continue termina la iteración actual
         * y pasa a la siguiente tarea.
         *
         * No elimina la tarea del array.
         */

        if (
            filtro !== 'todas' &&
            tarea.prioridad !== filtro
        ) {

            continue;

        }


        // ----------------------------------------------------
        // 7.5. FILTRAR POR TEXTO
        // ----------------------------------------------------

        /*
         * Normalizamos el título de la tarea.
         *
         * Ejemplo:
         *
         * "Preparar documentación"
         *
         * se transforma en:
         *
         * "preparar documentacion"
         *
         * La variable busqueda ya contiene
         * el texto normalizado del buscador.
         *
         * includes() comprueba si una cadena
         * contiene otra cadena.
         *
         * Ejemplo:
         *
         * 'preparar documentacion'
         *     .includes('documentacion')
         *
         * devuelve true.
         *
         * El operador ! niega el resultado.
         *
         * Por tanto:
         *
         * Si el título NO contiene el texto buscado,
         * omitimos la tarea mediante continue.
         */

        if (
            !normalizarTexto(tarea.titulo)
                .includes(busqueda)
        ) {

            continue;

        }


        // ----------------------------------------------------
        // 7.6. CREAR LA TARJETA HTML
        // ----------------------------------------------------

        /*
         * document.createElement() crea un elemento
         * HTML en memoria.
         *
         * Todavía no está insertado en el documento.
         *
         * Creamos:
         *
         * <article></article>
         */

        const tarjeta = document.createElement('article');


        /*
         * Asignamos una clase CSS.
         *
         * Resultado:
         *
         * <article class="tarea"></article>
         */

        tarjeta.className = 'tarea';


        /*
         * dataset permite trabajar con atributos
         * personalizados data-*.
         *
         * tarjeta.dataset.id = tarea.id
         *
         * genera:
         *
         * data-id="1"
         *
         * tarjeta.dataset.prioridad = tarea.prioridad
         *
         * genera:
         *
         * data-prioridad="alta"
         *
         * Estos atributos nos permiten recuperar
         * información desde el DOM.
         *
         * Los valores de dataset se manejan como cadenas.
         */

        tarjeta.dataset.id = tarea.id;

        tarjeta.dataset.prioridad = tarea.prioridad;


        // ----------------------------------------------------
        // 7.7. CREAR EL TÍTULO
        // ----------------------------------------------------

        /*
         * Creamos un encabezado h4.
         *
         * Después establecemos su texto.
         *
         * textContent inserta el título como texto,
         * sin interpretarlo como HTML.
         */

        const titulo = document.createElement('h4');

        titulo.textContent = tarea.titulo;


        /*
         * append() inserta el elemento titulo
         * dentro de la tarjeta.
         *
         * Estructura resultante:
         *
         * <article class="tarea">
         *     <h4>Preparar documentación</h4>
         * </article>
         */

        tarjeta.append(titulo);


        // ----------------------------------------------------
        // 7.8. MOSTRAR LA PRIORIDAD
        // ----------------------------------------------------

        /*
         * Creamos un elemento small.
         *
         * Se utiliza para mostrar información
         * secundaria de la tarea.
         */

        const detalle = document.createElement('small');

        detalle.textContent =
            'Prioridad: ' + tarea.prioridad;


        /*
         * Insertamos el texto de prioridad
         * y un salto de línea.
         *
         * append() permite insertar varios nodos
         * en una misma llamada.
         */

        tarjeta.append(
            detalle,
            document.createElement('br')
        );


        // ----------------------------------------------------
        // 7.9. CREAR LOS BOTONES DE ACCIÓN
        // ----------------------------------------------------

        /*
         * Cada tarjeta tendrá tres botones:
         *
         * Anterior
         * Siguiente
         * Eliminar
         *
         * En lugar de escribir tres bloques
         * prácticamente idénticos, utilizamos un array.
         *
         * Cada elemento contiene dos valores:
         *
         * accion:
         *    Identificador interno de la operación.
         *
         * texto:
         *    Texto visible del botón.
         *
         * En el for...of utilizamos desestructuración:
         *
         * const [accion, texto]
         *
         * Esto permite extraer los dos elementos
         * de cada array interior.
         */

        for (const [accion, texto] of [

            ['anterior', '← Anterior'],
            ['siguiente', 'Siguiente →'],
            ['eliminar', 'Eliminar']

        ]) {

            /*
             * Creamos un botón HTML.
             */

            const boton = document.createElement('button');


            /*
             * Establecemos type="button".
             *
             * Esto evita que el botón actúe como
             * botón de envío si se encuentra
             * dentro de un formulario.
             */

            boton.type = 'button';


            /*
             * Guardamos la acción en un atributo data-*.
             *
             * Ejemplo:
             *
             * data-accion="eliminar"
             *
             * Más adelante utilizaremos este atributo
             * para identificar qué operación realizar.
             */

            boton.dataset.accion = accion;


            /*
             * Establecemos el texto visible.
             */

            boton.textContent = texto;


            /*
             * Localizamos la posición del estado actual
             * dentro del array estados.
             *
             * indexOf() devuelve el índice
             * del elemento encontrado.
             *
             * Ejemplo:
             *
             * estados.indexOf('pendiente') -> 0
             * estados.indexOf('en-proceso') -> 1
             * estados.indexOf('completada') -> 2
             */

            const indice = estados.indexOf(tarea.estado);


            /*
             * Desactivamos los botones de movimiento
             * cuando la tarea se encuentra en un extremo.
             *
             * Si está pendiente:
             *
             * No puede retroceder.
             *
             * Si está completada:
             *
             * No puede avanzar.
             *
             * El operador && exige que se cumplan
             * las dos condiciones.
             *
             * El operador || permite combinar
             * dos situaciones alternativas.
             *
             * El botón Eliminar permanece habilitado.
             */

            boton.disabled = (

                (accion === 'anterior' && indice === 0) ||

                (
                    accion === 'siguiente' &&
                    indice === estados.length - 1
                )

            );


            /*
             * Insertamos el botón dentro de la tarjeta.
             */

            tarjeta.append(boton);

        }


        // ----------------------------------------------------
        // 7.10. INSERTAR LA TARJETA EN SU COLUMNA
        // ----------------------------------------------------

        /*
         * Cada tarea tiene un estado.
         *
         * Ejemplo:
         *
         * tarea.estado = 'pendiente'
         *
         * Construimos el selector:
         *
         * '#pendiente'
         *
         * Localizamos esa columna y añadimos
         * la tarjeta mediante append().
         *
         * Si la tarea cambia de estado,
         * aparecerá en otra columna durante
         * la siguiente renderización.
         */

        $('#' + tarea.estado).append(tarjeta);

    }


    // --------------------------------------------------------
    // 7.11. NOTIFICAR LA ACTUALIZACIÓN
    // --------------------------------------------------------

    /*
     * Cuando terminamos de construir el tablero,
     * emitimos el evento personalizado.
     *
     * Los listeners podrán consultar el número
     * total de tareas y las no completadas.
     */

    notificarCambio();

}


// ============================================================
// 8. CREACIÓN DE TAREAS
// ============================================================

/*
 * Registramos un listener para el evento submit
 * del formulario.
 *
 * submit se produce cuando el usuario intenta
 * enviar un formulario.
 *
 * Puede ocurrir al pulsar el botón de envío
 * o al presionar Enter en determinadas condiciones.
 *
 * El navegador normalmente intentaría enviar
 * el formulario y navegar a otra página.
 *
 * En nuestra aplicación queremos procesar
 * los datos mediante JavaScript.
 */

$('#formulario').addEventListener('submit', event => {

    /*
     * preventDefault() cancela el comportamiento
     * predeterminado del navegador.
     *
     * De esta forma evitamos que se recargue
     * la página al enviar el formulario.
     */

    event.preventDefault();


    /*
     * Recuperamos el título introducido.
     *
     * value devuelve el contenido del campo.
     *
     * trim() elimina los espacios al principio
     * y al final.
     */

    const titulo = $('#titulo').value.trim();


    /*
     * Comprobamos que el título no esté vacío.
     *
     * !titulo será true si titulo es una cadena vacía.
     *
     * Si no es válido:
     *
     * 1. Mostramos un mensaje.
     * 2. Colocamos el foco en el campo.
     * 3. Terminamos el manejador.
     */

    if (!titulo) {

        avisar('Introduce un título válido');

        $('#titulo').focus();

        return;

    }


    /*
     * Creamos una tarea y la añadimos al array.
     *
     * push() inserta un nuevo elemento al final.
     *
     * siguienteId++ asigna un identificador
     * y prepara el siguiente.
     *
     * titulo es una propiedad abreviada.
     *
     * Equivale a:
     *
     * titulo: titulo
     *
     * Las nuevas tareas siempre comienzan
     * en estado pendiente.
     */

    tareas.push({

        id: siguienteId++,

        titulo,

        prioridad: $('#prioridad').value,

        estado: 'pendiente'

    });


    /*
     * reset() devuelve los controles del formulario
     * a sus valores predeterminados.
     */

    $('#formulario').reset();


    /*
     * Actualizamos el contador de caracteres.
     *
     * El texto mostrado indica que el campo
     * contiene cero caracteres de un máximo de 80.
     */

    $('#contador').textContent = '0/80';


    /*
     * Informamos al usuario.
     */

    avisar('Tarea añadida correctamente');


    /*
     * Reconstruimos el tablero para que
     * aparezca la nueva tarea.
     */

    renderizar();


    /*
     * Devolvemos el foco al campo del título.
     *
     * Esto permite introducir otra tarea
     * sin tener que pulsar nuevamente el campo.
     */

    $('#titulo').focus();

});


// ============================================================
// 9. BÚSQUEDA DE TAREAS CON DEBOUNCE
// ============================================================

/*
 * Creamos una función de búsqueda controlada
 * mediante debounce.
 *
 * La función recibe el texto escrito.
 *
 * Normalizamos ese texto para que la búsqueda
 * no distinga entre mayúsculas y tildes.
 *
 * La variable busqueda almacena el resultado.
 *
 * Después llamamos a renderizar().
 *
 * El tiempo de espera es de 300 milisegundos.
 *
 * Si se producen nuevas llamadas antes de que
 * termine la espera, se cancela el temporizador
 * anterior y se crea uno nuevo.
 */

const buscarConRetraso = debounce(texto => {

    /*
     * Convertimos el texto de búsqueda
     * a una representación normalizada.
     *
     * Ejemplo:
     *
     * " DOCUMENTACIÓN "
     *
     * se convierte en:
     *
     * "documentacion"
     */

    busqueda = normalizarTexto(texto);


    /*
     * Actualizamos las tareas visibles.
     */

    renderizar();

}, 300);


/*
 * Escuchamos el evento input del buscador.
 *
 * input se dispara cuando cambia el valor
 * del campo por una acción del usuario.
 *
 * event.target identifica el elemento
 * que originó el evento.
 *
 * event.target.value contiene el texto actual.
 *
 * Capturamos el valor inmediatamente y lo enviamos
 * a la función de búsqueda con retraso.
 */

$('#buscar').addEventListener('input', event => {

    const texto = event.target.value;

    buscarConRetraso(texto);

});


// ============================================================
// 10. FILTRADO POR PRIORIDAD
// ============================================================

/*
 * Escuchamos el evento change del desplegable.
 *
 * change se dispara cuando el usuario confirma
 * una nueva selección.
 *
 * En este caso no necesitamos debounce,
 * porque queremos aplicar el filtro inmediatamente.
 *
 * Pasamos renderizar sin paréntesis.
 *
 * renderizar:
 *    Referencia a la función.
 *
 * renderizar():
 *    Ejecutaría la función inmediatamente.
 *
 * addEventListener necesita recibir una función,
 * no el resultado de ejecutarla.
 */

$('#filtro').addEventListener('change', renderizar);


// ============================================================
// 11. DELEGACIÓN DE EVENTOS EN EL TABLERO
// ============================================================

/*
 * El tablero contiene varias tarjetas.
 *
 * Cada tarjeta contiene botones de acción.
 *
 * Podríamos registrar un listener en cada botón,
 * pero eso complicaría la gestión de elementos
 * creados dinámicamente.
 *
 * Utilizamos delegación de eventos:
 *
 * Registramos un único listener en #tablero.
 *
 * Cuando se pulsa un botón, el evento click
 * se propaga hacia sus elementos antecesores.
 *
 * El listener del tablero puede detectar
 * qué botón originó el evento.
 *
 * Esta técnica permite gestionar también
 * los botones de tareas creadas posteriormente.
 */

$('#tablero').addEventListener('click', event => {


    // --------------------------------------------------------
    // 11.1. IDENTIFICAR EL BOTÓN PULSADO
    // --------------------------------------------------------

    /*
     * event.target:
     *
     * Es el elemento donde se originó el evento.
     *
     * event.currentTarget:
     *
     * Es el elemento cuyo listener se está ejecutando.
     *
     * En este caso, currentTarget es #tablero.
     *
     * closest() busca el elemento más cercano
     * que coincida con un selector CSS.
     *
     * El selector:
     *
     * button[data-accion]
     *
     * selecciona botones que tengan el atributo
     * data-accion, independientemente de su valor.
     *
     * Si el usuario pulsa un span dentro del botón,
     * closest() puede encontrar el botón antecesor.
     *
     * Si no encuentra ninguno, devuelve null.
     *
     * Comprobamos que target sea un Element,
     * porque closest() es un método de Element.
     */

    if (!(event.target instanceof Element)) {

        return;

    }

    const boton = event.target.closest(
        'button[data-accion]'
    );


    /*
     * Primera condición:
     *
     * !boton
     *
     * No se ha encontrado ningún botón válido.
     *
     * Segunda condición:
     *
     * !event.currentTarget.contains(boton)
     *
     * El botón encontrado no pertenece al tablero.
     *
     * contains() comprueba si un elemento contiene
     * a otro dentro del árbol DOM.
     *
     * El operador || representa OR lógico.
     *
     * Si cualquiera de las condiciones es verdadera,
     * terminamos el manejador.
     */

    if (
        !boton ||
        !event.currentTarget.contains(boton)
    ) {

        return;

    }


    // --------------------------------------------------------
    // 11.2. LOCALIZAR LA TARJETA
    // --------------------------------------------------------

    /*
     * Partiendo del botón, buscamos el elemento
     * antecesor con la clase tarea.
     *
     * Ejemplo:
     *
     * <article class="tarea" data-id="2">
     *     <button data-accion="eliminar">
     *         Eliminar
     *     </button>
     * </article>
     *
     * boton.closest('.tarea')
     *
     * devuelve el article.
     */

    const tarjeta = boton.closest('.tarea');


    /*
     * Comprobamos que se haya encontrado
     * una tarjeta válida dentro del tablero.
     */

    if (
        !tarjeta ||
        !event.currentTarget.contains(tarjeta)
    ) {

        return;

    }


    // --------------------------------------------------------
    // 11.3. RECUPERAR EL IDENTIFICADOR
    // --------------------------------------------------------

    /*
     * Cada tarjeta tiene un atributo data-id.
     *
     * Ejemplo:
     *
     * data-id="2"
     *
     * dataset.id devuelve una cadena:
     *
     * "2"
     *
     * Number() convierte esa cadena
     * en un valor numérico:
     *
     * 2
     *
     * Esto es importante porque los identificadores
     * del array tareas son números.
     */

    const id = Number(tarjeta.dataset.id);


    // --------------------------------------------------------
    // 11.4. BUSCAR LA TAREA EN EL ARRAY
    // --------------------------------------------------------

    /*
     * findIndex() busca la posición del primer
     * elemento que cumpla una condición.
     *
     * En este caso:
     *
     * t.id === id
     *
     * Compara el identificador de cada tarea
     * con el identificador recuperado del DOM.
     *
     * === compara valor y tipo.
     *
     * Si encuentra la tarea, devuelve su índice.
     *
     * Si no la encuentra, devuelve -1.
     */

    const indice = tareas.findIndex(
        tarea => tarea.id === id
    );


    /*
     * Si el índice es negativo,
     * no se ha encontrado la tarea.
     */

    if (indice < 0) {

        return;

    }


    // --------------------------------------------------------
    // 11.5. RECUPERAR LA ACCIÓN
    // --------------------------------------------------------

    /*
     * Leemos el atributo data-accion del botón.
     *
     * Posibles valores:
     *
     * anterior
     * siguiente
     * eliminar
     */

    const accion = boton.dataset.accion;


    // --------------------------------------------------------
    // 11.6. ELIMINAR UNA TAREA
    // --------------------------------------------------------

    /*
     * Si la acción es eliminar,
     * borramos la tarea del array.
     *
     * splice() permite eliminar o insertar
     * elementos en una posición concreta.
     *
     * Sintaxis:
     *
     * array.splice(indice, cantidad)
     *
     * En nuestro caso:
     *
     * indice:
     *    Posición de la tarea.
     *
     * 1:
     *    Número de elementos que eliminamos.
     */

    if (accion === 'eliminar') {

        tareas.splice(indice, 1);

        avisar('Tarea eliminada correctamente');

    }


    // --------------------------------------------------------
    // 11.7. MOVER UNA TAREA ENTRE ESTADOS
    // --------------------------------------------------------

    /*
     * Si la acción es anterior o siguiente,
     * modificamos el estado de la tarea.
     *
     * Primero averiguamos su posición actual
     * dentro del array estados.
     *
     * Después calculamos la nueva posición.
     */

    else if (
        accion === 'anterior' ||
        accion === 'siguiente'
    ) {

        /*
         * Recuperamos el estado actual.
         *
         * Por ejemplo:
         *
         * tareas[indice].estado = 'en-proceso'
         *
         * estados.indexOf('en-proceso')
         *
         * devuelve 1.
         */

        const actual = estados.indexOf(
            tareas[indice].estado
        );


        /*
         * Utilizamos el operador ternario.
         *
         * Sintaxis:
         *
         * condicion ? valorSiTrue : valorSiFalse
         *
         * Si la acción es siguiente:
         *    desplazamiento = 1
         *
         * Si la acción es anterior:
         *    desplazamiento = -1
         */

        const desplazamiento =
            accion === 'siguiente' ? 1 : -1;


        /*
         * Calculamos el índice del nuevo estado.
         */

        const nuevoIndice = actual + desplazamiento;


        /*
         * Comprobamos que el nuevo índice esté
         * dentro de los límites del array.
         *
         * No permitimos:
         *
         * - Retroceder desde pendiente.
         * - Avanzar desde completada.
         *
         * Esta comprobación protege la lógica
         * incluso si alguien provoca el evento
         * mediante código JavaScript.
         */

        if (
            nuevoIndice < 0 ||
            nuevoIndice >= estados.length
        ) {

            return;

        }


        /*
         * Asignamos el nuevo estado.
         *
         * Ejemplo:
         *
         * actual = 0
         * desplazamiento = 1
         * nuevoIndice = 1
         *
         * estados[1] = 'en-proceso'
         *
         * La tarea pasa de pendiente a en-proceso.
         */

        tareas[indice].estado = estados[nuevoIndice];


        /*
         * Informamos de la operación.
         */

        avisar('Acción realizada: ' + accion);

    }


    // --------------------------------------------------------
    // 11.8. DESCARTAR ACCIONES DESCONOCIDAS
    // --------------------------------------------------------

    /*
     * Si el botón contiene una acción distinta
     * de las reconocidas, no hacemos nada.
     */

    else {

        return;

    }


    // --------------------------------------------------------
    // 11.9. ACTUALIZAR EL TABLERO
    // --------------------------------------------------------

    /*
     * Después de eliminar o mover una tarea,
     * reconstruimos el tablero.
     *
     * Así se refleja inmediatamente el nuevo estado
     * del array tareas en la interfaz.
     *
     * renderizar() también emitirá el evento
     * personalizado tareas:cambiadas.
     */

    renderizar();

});


$('#tablero').addEventListener('dblclick', event => {

    const titulo = event.target.closest('.tarea h4');

    if(!titulo || !$('#tablero').contains(titulo)) {
        return;
    }

    const tarea = tareas.find(
        t => t.id === Number(titulo.closest('.tarea').dataset.id
    )
    );


    if(!tarea){
        return;
    }

    const nuevo = prompt('Nuevo título: ', tarea.titulo);

    if (nuevo === null || !nuevo.trim()) {
        return;
    }


    tarea.titulo = nuevo.trim().slice(0,80);

    renderizar();

    avisar('Título actualizado');

});

document.addEventListener('keydown', event => {

    if ( event.key === "Escape"  &&
        document.activeElement.matches('input,select')
     ) {
        document.activeElement.blur();
        return;
     }

     

     if (event.key === '/'){
        event.preventDefault();
        $('#buscar').focus();
     }

    const editando = 
          event.target.matches('input,textarea,select') ||
          event.target.isContentEditable;

    if ( editando ||
           event.altKey ||
           event.ctrlKey ||
           event.metaKey
     )     {
        return;
     }


});

$('#titulo').addEventListener('input', event => {
    $('#contador').textContent = 
        event.target.value.length + '/80';
});

$('#formulario').addEventListener('reset', () => {
    $('#contador').textContent = '0/80';
});

$('#titulo').addEventListener('focus', () => {
    avisar('Escribe un título y pulsa añadir');
});

$('#titulo').addEventListener('blur', () => {


    if (!$('#titulo').value.trim()){
        avisar('No puedes dejar le título vacío');
    } else {
       avisar('');
    }

});




// ============================================================
// 12. INICIALIZACIÓN DE LA APLICACIÓN
// ============================================================

/*
 * Ejecutamos renderizar() cuando se carga el script.
 *
 * Esto permite mostrar las tareas iniciales
 * sin esperar a que el usuario realice una acción.
 *
 * El proceso será:
 *
 * 1. Limpiar las columnas.
 * 2. Recorrer las tareas iniciales.
 * 3. Crear sus tarjetas.
 * 4. Crear sus botones.
 * 5. Insertarlas en sus columnas.
 * 6. Emitir el evento tareas:cambiadas.
 *
 * Es importante que los elementos HTML
 * ya existan cuando se ejecute esta instrucción.
 */

renderizar();

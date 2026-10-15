const API_URL =
    'https://apidemo.geoeducacion.com.ar/api/testing/pearson/1';

const cardsContainer =
    document.getElementById('cardsContainer');

const errorContainer =
    document.getElementById('errorContainer');

const mainResult =
    document.getElementById('mainResult');

const mainResultText =
    document.getElementById('mainResultText');




// Guardo los gráficos para poder destruirlos antes de volver a crearlos.
let charts = [];


// Combinaciones que debemos analizar

const combinaciones = [

    {
        x: 'presion',
        y: 'temperatura',
        nombreX: 'Presión',
        nombreY: 'Temperatura',
        unidadX: 'hPa',
        unidadY: '°C'
    },

    {
        x: 'presion',
        y: 'humedad',
        nombreX: 'Presión',
        nombreY: 'Humedad',
        unidadX: 'hPa',
        unidadY: '%'
    },

    {
        x: 'presion',
        y: 'viento',
        nombreX: 'Presión',
        nombreY: 'Velocidad del viento',
        unidadX: 'hPa',
        unidadY: 'km/h'
    },

    {
        x: 'temperatura',
        y: 'humedad',
        nombreX: 'Temperatura',
        nombreY: 'Humedad',
        unidadX: '°C',
        unidadY: '%'
    },

    {
        x: 'temperatura',
        y: 'viento',
        nombreX: 'Temperatura',
        nombreY: 'Velocidad del viento',
        unidadX: '°C',
        unidadY: 'km/h'
    },

    {
        x: 'humedad',
        y: 'viento',
        nombreX: 'Humedad',
        nombreY: 'Velocidad del viento',
        unidadX: '%',
        unidadY: 'km/h'
    }

];


// Cuando termina de cargar la página
document.addEventListener('DOMContentLoaded', () => {

    cargarDatos();

});

// CONSULTAR API

async function cargarDatos() {

    try {

        errorContainer.classList.add('hidden');

        const response = await fetch(API_URL, {
            cache: 'no-store'
        });

        const result = await response.json();


        if (
            result.success &&
            result.data &&
            result.data.length > 0
        ) {

            const valores = result.data[0].valores;

            analizarDatos(valores);

        } else {

            mostrarError(
                'No se pudieron obtener los datos de la API.'
            );

        }

    } catch (error) {

        console.error(
            'Error al consultar la API:',
            error
        );

        mostrarError(
            'Se produjo un error al intentar consultar la API.'
        );

    }

}


// ANALIZAR TODAS LAS COMBINACIONES

function analizarDatos(valores) {

    // Elimina las cards anteriores
    cardsContainer.innerHTML = '';

    // Destruye gráficos anteriores
    charts.forEach(chart => chart.destroy());

    charts = [];


    const resultados = [];


    combinaciones.forEach((combinacion, index) => {

        // Obtenemos los valores de X
        const valoresX = valores.map(
            dato => Number(dato[combinacion.x])
        );

        // Obtenemos los valores de Y
        const valoresY = valores.map(
            dato => Number(dato[combinacion.y])
        );


        // Calculamos Pearson
        const pearson =
            calcularPearson(valoresX, valoresY);


        resultados.push({

            combinacion: combinacion,

            pearson: pearson

        });


        // Creamos la card
        crearCard(
            combinacion,
            pearson,
            valoresX,
            valoresY,
            index
        );

    });


    // Buscar la correlación más fuerte
    mostrarMayorCorrelacion(resultados);

}

// CÁLCULO DEL COEFICIENTE DE PEARSON

function calcularPearson(x, y) {

    const cantidad = x.length;


    // Calcular media de X
    const mediaX =
        x.reduce((acumulador, valor) =>
            acumulador + valor, 0
        ) / cantidad;


    // Calcular media de Y
    const mediaY =
        y.reduce((acumulador, valor) =>
            acumulador + valor, 0
        ) / cantidad;


    let numerador = 0;

    let sumaCuadradosX = 0;

    let sumaCuadradosY = 0;


    for (let i = 0; i < cantidad; i++) {

        const diferenciaX =
            x[i] - mediaX;

        const diferenciaY =
            y[i] - mediaY;


        numerador +=
            diferenciaX * diferenciaY;


        sumaCuadradosX +=
            diferenciaX ** 2;


        sumaCuadradosY +=
            diferenciaY ** 2;

    }


    const denominador =
        Math.sqrt(
            sumaCuadradosX *
            sumaCuadradosY
        );


    if (denominador === 0) {

        return 0;

    }


    return numerador / denominador;

}

// CREAR CARD

function crearCard(
    combinacion,
    pearson,
    valoresX,
    valoresY,
    index
) {

    const card =
        document.createElement('article');

    card.classList.add('pearson-card');


    const descripcion =
        interpretarPearson(pearson);


    card.innerHTML = `

        <h2>
            ${combinacion.nombreX}
            y
            ${combinacion.nombreY}
        </h2>

        <div class="pearson-value">

            <span>
                Coeficiente de Pearson
            </span>

            <strong>
                ${pearson.toFixed(4)}
            </strong>

        </div>

        <div class="chart-container">

            <canvas id="chart-${index}"></canvas>

        </div>

        <div class="analysis">

            <strong>Análisis:</strong>

            ${descripcion}

        </div>

    `;


    cardsContainer.appendChild(card);


    crearGrafico(
        combinacion,
        valoresX,
        valoresY,
        index
    );

}

// INTERPRETAR RANGOS DE COEFICIENTE DE PEARSON

function interpretarPearson(r) {

    const valorAbsoluto = Math.abs(r);

    let intensidad;


    if (valorAbsoluto >= 0.8) {

        intensidad = 'muy fuerte';

    } else if (valorAbsoluto >= 0.6) {

        intensidad = 'fuerte';

    } else if (valorAbsoluto >= 0.4) {

        intensidad = 'moderada';

    } else if (valorAbsoluto >= 0.2) {

        intensidad = 'débil';

    } else {

        intensidad = 'muy débil o prácticamente nula';

    }


    let direccion;


    if (r > 0) {

        direccion = 'positiva';

    } else if (r < 0) {

        direccion = 'negativa';

    } else {

        direccion = 'nula';

    }


    let explicacion;


    if (r > 0) {

        explicacion =
            'Esto indica que, en general, cuando una variable aumenta, la otra también tiende a aumentar.';

    } else if (r < 0) {

        explicacion =
            'Esto indica que, en general, cuando una variable aumenta, la otra tiende a disminuir.';

    } else {

        explicacion =
            'No se observa una relación lineal entre ambas variables.';

    }


    return `
        Se observa una correlación
        <strong>${intensidad} ${direccion}</strong>
        (r = ${r.toFixed(4)}).
        ${explicacion}
    `;

}

// CREAR GRÁFICO DE DISPERSIÓN

function crearGrafico(
    combinacion,
    valoresX,
    valoresY,
    index
) {

    const puntos =
        valoresX.map((valorX, i) => {

            return {

                x: valorX,

                y: valoresY[i]

            };

        });


    const canvas =
        document.getElementById(`chart-${index}`);


    const ctx =
        canvas.getContext('2d');


    const chart = new Chart(ctx, {

        type: 'scatter',

        data: {

            datasets: [

                {

                    label:
                        `${combinacion.nombreX} vs ${combinacion.nombreY}`,

                    data: puntos,

                    backgroundColor: '#2563eb',

                    borderColor: '#2563eb',

                    pointRadius: 5,

                    pointHoverRadius: 7

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false

                }

            },

            scales: {

                x: {

                    title: {

                        display: true,

                        text:
                            `${combinacion.nombreX} (${combinacion.unidadX})`

                    }

                },

                y: {

                    title: {

                        display: true,

                        text:
                            `${combinacion.nombreY} (${combinacion.unidadY})`

                    }

                }

            }

        }

    });


    charts.push(chart);

}

// BUSCAR LA CORRELACIÓN MÁS FUERTE

function mostrarMayorCorrelacion(resultados) {

    let mayor = resultados[0];


    for (let i = 1; i < resultados.length; i++) {

        if (
            Math.abs(resultados[i].pearson) >
            Math.abs(mayor.pearson)
        ) {

            mayor = resultados[i];

        }

    }


    const r = mayor.pearson;

    const combinacion = mayor.combinacion;


    let direccion;


    if (r > 0) {

        direccion = 'positiva';

    } else if (r < 0) {

        direccion = 'negativa';

    } else {

        direccion = 'nula';

    }


    mainResultText.innerHTML = `

        El par con mayor correlación es

        <strong>
            ${combinacion.nombreX}
            y
            ${combinacion.nombreY}
        </strong>,

        con un coeficiente de Pearson de

        <strong>
            ${r.toFixed(4)}
        </strong>.

        La relación es

        <strong>
            ${direccion}
        </strong>.

        ${obtenerConclusionMayorCorrelacion(r)}

    `;


    mainResult.classList.remove('hidden');

}


// CONCLUSIÓN DE LA MAYOR CORRELACIÓN

function obtenerConclusionMayorCorrelacion(r) {

    const valorAbsoluto =
        Math.abs(r);


    if (valorAbsoluto >= 0.8) {

        return `
            Esto indica que existe una relación lineal
            muy importante entre ambas variables.
        `;

    }


    if (valorAbsoluto >= 0.6) {

        return `
            Esto indica que existe una relación lineal
            considerable entre ambas variables.
        `;

    }


    if (valorAbsoluto >= 0.4) {

        return `
            La relación lineal entre ambas variables
            es moderada.
        `;

    }


    if (valorAbsoluto >= 0.2) {

        return `
            La relación lineal existe, aunque es débil.
        `;

    }


    return `
        Incluso siendo la mayor correlación encontrada,
        la relación lineal entre las variables es muy débil.
    `;

}


// MOSTRAR ERROR

function mostrarError(mensaje) {

    errorContainer.textContent =
        mensaje;

    errorContainer.classList.remove(
        'hidden'
    );

}
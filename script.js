// Inicialización de Firebase
const firebaseConfig = {
    // Reemplaza con tu configuración de Firebase
    apiKey:AIzaSyBEO4kGVuRJbZ9pf4Ruf-V21ZuPLBKl6z0,
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Inicialización de Google Maps
let map;
let polyline;
let watchId;
let ubicacionActiva = false;
let seguimientoEnVivoActivo = false;
let intervalId;
const mapaDiv = document.getElementById("map");

function initMap() {
    // Si el elemento del mapa existe
    if (mapaDiv) {
        map = new google.maps.Map(mapaDiv, {
            center: { lat: -34.397, lng: 150.644 }, // Coordenadas de ejemplo
            zoom: 15,
        });
    } else {
        console.error("Elemento 'map' no encontrado en el HTML.");
    }
}

// Función para registrar un usuario
document.getElementById("registroForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value;
    const nit = document.getElementById("nit").value;
    const direccion = document.getElementById("direccion").value;
    const sector = document.getElementById("sector").value;
    const telefono = document.getElementById("telefono").value;
    const correo = document.getElementById("correo").value;

    db.collection("usuarios")
        .add({
            nombre,
            nit,
            direccion,
            sector,
            telefono,
            correo,
        })
        .then(() => {
            alert("Usuario registrado exitosamente.");
            document.getElementById("registroForm").reset();
            actualizarListaUsuarios(); // Actualiza la lista de usuarios
        })
        .catch((error) => {
            console.error("Error al registrar usuario:", error);
            alert("Error al registrar usuario.");
        });
});

// Función para actualizar la lista de usuarios en la tabla
function actualizarListaUsuarios() {
    db.collection("usuarios")
        .get()
        .then((querySnapshot) => {
            const tablaBody = document.querySelector("#tablaUsuarios tbody");
            tablaBody.innerHTML = ""; // Limpia la tabla
            querySnapshot.forEach((doc) => {
                const usuario = doc.data();
                const row = tablaBody.insertRow();
                row.insertCell().textContent = usuario.nombre;
                row.insertCell().textContent = usuario.nit;
                row.insertCell().textContent = usuario.direccion;
                row.insertCell().textContent = usuario.sector;
                row.insertCell().textContent = usuario.telefono;
                row.insertCell().textContent = usuario.correo;
            });
        })
        .catch((error) => {
            console.error("Error al obtener usuarios:", error);
        });
}

// Llama a la función para mostrar la lista de usuarios al cargar la página
actualizarListaUsuarios();

// Función para iniciar el seguimiento de la ubicación
function activarUbicacion() {
    if (!navigator.geolocation) {
        alert("Tu navegador no soporta la geolocalización.");
        return;
    }

    ubicacionActiva = true;
    document.getElementById("grabacionActiva").style.display = "inline";

    polyline = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 6,
        map: map,
    });

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const punto = new google.maps.LatLng(latitude, longitude);
            polyline.getPath().push(punto);

            // Guarda la ubicación en Firestore
            db.collection("ubicaciones")
                .add({
                    latitude,
                    longitude,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    usuario: document.getElementById("nombreReciclador").value, // Asocia la ubicación al reciclador
                })
                .then(() => {
                    console.log("Ubicación guardada en Firestore");
                })
                .catch((error) => {
                    console.error("Error al guardar ubicación:", error);
                });
        },
        (error) => {
            console.error("Error al obtener la ubicación:", error);
            alert("Error al obtener la ubicación: " + error.message);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

// Función para detener el seguimiento de la ubicación
function detenerUbicacion() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    ubicacionActiva = false;
    document.getElementById("grabacionActiva").style.display = "none";
    alert("Seguimiento de ubicación detenido.");
}

// Función para iniciar el seguimiento en vivo (simulado)
function iniciarSeguimientoEnVivo() {
    if (seguimientoEnVivoActivo) {
        alert("El seguimiento en vivo ya está activo.");
        return;
    }

    seguimientoEnVivoActivo = true;
    const nombreReciclador = document.getElementById("nombreReciclador").value;

    // Simulación de movimiento (reemplaza con datos reales si tienes)
    const rutaSimulada = [
        { lat: -34.397, lng: 150.644 },
        { lat: -34.400, lng: 150.640 },
        { lat: -34.405, lng: 150.630 },
        { lat: -34.410, lng: 150.620 },
    ];
    let contador = 0;

    intervalId = setInterval(() => {
        if (contador < rutaSimulada.length) {
            const punto = rutaSimulada[contador];
            const marker = new google.maps.Marker({
                position: punto,
                map: map,
                title: `Ubicación ${contador + 1} - ${nombreReciclador}`,
            });

            // Guarda la ubicación simulada en Firestore
            db.collection("ubicaciones").add({
                latitude: punto.lat,
                longitude: punto.lng,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                usuario: nombreReciclador, // Asocia la ubicación al reciclador
            });

            contador++;
        } else {
            clearInterval(intervalId);
            seguimientoEnVivoActivo = false;
            alert("Fin de la ruta simulada.");
        }
    }, 2000); // Actualiza cada 2 segundos
}

// Función para detener el seguimiento en vivo
function detenerSeguimientoEnVivo() {
    clearInterval(intervalId);
    seguimientoEnVivoActivo = false;
    alert("Seguimiento en vivo detenido.");
}

// Función para cambiar el estado del servicio
function cambiarEstado(estado) {
    const nombreReciclador = document.getElementById("nombreReciclador").value;
    db.collection("estados")
        .doc(nombreReciclador) // Usa el nombre del reciclador como ID del documento
        .set({
            estado,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            usuario: nombreReciclador,
        })
        .then(() => {
            alert(`Estado del servicio cambiado a ${estado}.`);
        })
        .catch((error) => {
            console.error("Error al cambiar el estado:", error);
            alert("Error al cambiar el estado del servicio.");
        });
}

// Función para mostrar la trayectoria del usuario
function mostrarTrayectoria() {
    const nombreReciclador = document.getElementById("nombreReciclador").value;
    db.collection("ubicaciones")
        .where("usuario", "==", nombreReciclador)
        .orderBy("timestamp")
        .get()
        .then((querySnapshot) => {
            const path = [];
            querySnapshot.forEach((doc) => {
                const ubicacion = doc.data();
                path.push({ lat: ubicacion.latitude, lng: ubicacion.longitude });
            });

            if (polyline) {
                polyline.setMap(null); // Elimina la polylinea anterior
            }
            polyline = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: "#0000FF",
                strokeOpacity: 1.0,
                strokeWeight: 6,
                map: map,
            });

             // Centra el mapa en el último punto de la trayectoria
            if (path.length > 0) {
                map.setCenter(path[path.length - 1]);
            }

        })
        .catch((error) => {
            console.error("Error al obtener la trayectoria:", error);
            alert("Error al obtener la trayectoria.");
        });
}

// Función para mostrar todas las trayectorias
function mostrarTodasTrayectorias() {
    db.collection("ubicaciones")
        .get()
        .then((querySnapshot) => {
            const rutas = {}; // Objeto para agrupar las ubicaciones por usuario
            querySnapshot.forEach((doc) => {
                const ubicacion = doc.data();
                if (!rutas[ubicacion.usuario]) {
                    rutas[ubicacion.usuario] = [];
                }
                rutas[ubicacion.usuario].push({
                    lat: ubicacion.latitude,
                    lng: ubicacion.longitude,
                });
            });

            // Elimina las polylineas anteriores
            if (polyline) {
                polyline.setMap(null);
            }

            // Dibuja las trayectorias
            for (const usuario in rutas) {
                const path = rutas[usuario];
                new google.maps.Polyline({
                    path: path,
                    geodesic: true,
                    strokeColor: '#' + Math.floor(Math.random() * 16777215).toString(16), // Color aleatorio
                    strokeOpacity: 1.0,
                    strokeWeight: 6,
                    map: map,
                });
                // Centra el mapa en el último punto de la trayectoria del primer usuario.
                if (path.length > 0) {
                    map.setCenter(path[path.length-1]);
                }
            }
        })
        .catch((error) => {
            console.error("Error al obtener todas las trayectorias:", error);
            alert("Error al obtener todas las trayectorias.");
        });
}

// Función para descargar la ruta en formato CSV
function descargarRuta() {
    const nombreReciclador = document.getElementById("nombreReciclador").value;
    db.collection("ubicaciones")
        .where("usuario", "==", nombreReciclador)
        .orderBy("timestamp")
        .get()
        .then((querySnapshot) => {
            let csvContent = "Latitud,Longitud,Timestamp\n"; // Encabezados del CSV
            querySnapshot.forEach((doc) => {
                const ubicacion = doc.data();
                const timestamp = ubicacion.timestamp
                    ? ubicacion.timestamp.toDate().toISOString()
                    : ""; // Convierte Timestamp de Firestore a string
                csvContent += `${ubicacion.latitude},${ubicacion.longitude},${timestamp}\n`;
            });

            if (csvContent === "Latitud,Longitud,Timestamp\n") {
                alert("No hay datos de ruta para descargar.");
                return;
            }
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `ruta_${nombreReciclador}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch((error) => {
            console.error("Error al descargar la ruta:", error);
            alert("Error al descargar la ruta.");
        });
}
// Función para descargar todas las rutas en formato CSV
function descargarTodasRutas() {
    db.collection("ubicaciones")
        .get()
        .then((querySnapshot) => {
            let csvContent = "Usuario,Latitud,Longitud,Timestamp\n"; // Encabezados del CSV
            const rutas = {};  // Agrupar datos por usuario

            querySnapshot.forEach((doc) => {
                const ubicacion = doc.data();
                const timestamp = ubicacion.timestamp
                    ? ubicacion.timestamp.toDate().toISOString()
                    : "";
                if (!rutas[ubicacion.usuario]) {
                    rutas[ubicacion.usuario] = [];
                }
                rutas[ubicacion.usuario].push({
                    latitude: ubicacion.latitude,
                    longitude: ubicacion.longitude,
                    timestamp: timestamp
                });
            });

            // Convertir los datos agrupados a formato CSV
            for (const usuario in rutas) {
                rutas[usuario].forEach(punto => {
                    csvContent += `${usuario},${punto.latitude},${punto.longitude},${punto.timestamp}\n`;
                });
            }
            if (csvContent === "Usuario,Latitud,Longitud,Timestamp\n") {
                alert("No hay datos de rutas para descargar.");
                return;
            }

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "todas_las_rutas.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        })
        .catch((error) => {
            console.error("Error al descargar todas las rutas:", error);
            alert("Error al descargar las rutas.");
        });
}

// app/api/bypass/route.js

export async function GET(req) {
  // Obtener el parámetro 'titulo' de la URL
  const { searchParams } = new URL(req.url);
  const titulo = searchParams.get("titulo");

  if (!titulo) {
    return new Response(
      JSON.stringify({ error: 'Falta el parámetro "titulo"' }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Construir el cuerpo de la solicitud
    const body = new URLSearchParams();
    body.append("value", titulo);

    // Realizar la solicitud a la API de AnimeFLV
    const response = await fetch(
      "https://www3.animeflv.net/api/animes/search",
      {
        method: "POST",
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "es-419,es;q=0.9",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          pragma: "no-cache",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
        },
        body: body.toString(),
        credentials: "include",
      }
    );

    const data = await response.json();

    // Responder con los datos obtenidos
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://www.crunchyroll.com", // Restringido a Crunchyroll
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Métodos permitidos
        "Access-Control-Allow-Headers": "Content-Type", // Encabezados permitidos
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error en la solicitud a AnimeFLV",
        errorText: error,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://www.crunchyroll.com", // Restringido a Crunchyroll
        },
      }
    );
  }
}

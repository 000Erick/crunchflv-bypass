// app/api/bypass/route.js

export async function GET(req) {
  // Obtener el parámetro 'titulo' de la URL
  const { searchParams } = new URL(req.url);
  const title = decodeURIComponent(searchParams.get("title"));
  const episode_number = searchParams.get("episodeNumber");

  if (!title) {
    return new Response(
      JSON.stringify({ error: 'Falta el parámetro "titulo"' }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const dataAnime = await searchAnime(title);
    const urlEpisodeByNumber = await getAnimeEpisodes(
      dataAnime[0].slug,
      episode_number
    );
    console.log("URL del episodio:", urlEpisodeByNumber);

    const config = await getDisqusConfig(urlEpisodeByNumber);
    console.log("Configuración", config);

    // Responder con los datos obtenidos
    return new Response(JSON.stringify(config), {
      status: 200,
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

async function searchAnime(titulo) {
  // Construir el cuerpo de la solicitud
  const body = new URLSearchParams();
  body.append("value", titulo);

  // Realizar la solicitud a la API de AnimeFLV
  const response = await fetch("https://www3.animeflv.net/api/animes/search", {
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
  });

  return response.json();
}

async function getAnimeEpisodes(slug, episodeNumber) {
  const animeUrl = `https://www3.animeflv.net/anime/${slug}`;

  try {
    const response = await fetch(animeUrl, {
      method: "GET",
    });

    const html = await response.text();

    // Extraemos el script que contiene los episodios usando una expresión regular
    const episodesMatch = html.match(/var episodes = (\[\[.+?\]\]);/);
    if (episodesMatch && episodesMatch[1]) {
      let episodes = JSON.parse(episodesMatch[1]);
      //   console.log("Episodios encontrados antes de invertir:", episodes);

      // Invertimos el array para tener los episodios en el orden deseado
      episodes = episodes.reverse();
      //   console.log("Episodios después de invertir:", episodes);

      // Accedemos directamente al episodio usando el índice, restando 1
      const episodeData = episodes[episodeNumber - 1]; // Restamos 1 para acceder al índice correcto

      if (episodeData) {
        const episodeId = episodeData[0]; // Extraemos siempre el valor en la posición 0
        console.log(`ID del episodio ${episodeNumber}:`, episodeId);

        // Aquí podrías continuar con la lógica para inyectar los comentarios
        return `https://www3.animeflv.net/ver/${slug}-${episodeId}`;
      } else {
        console.log(
          `No se encontró el episodio con el número ${episodeNumber}.`
        );
        // alert("No se encontró el episodio en AnimeFLV.");
        return null;
      }
    } else {
      console.log("No se encontraron los episodios en el HTML.");
      //   alert("No se pudieron encontrar los episodios en la página de AnimeFLV.");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener el HTML del anime:", error);
    // alert("Error al conectarse a la página de AnimeFLV.");
    return null;
  }
}

async function getDisqusConfig(urlEpisodeByNumber) {
  const episodeUrl = urlEpisodeByNumber;

  try {
    const response = await fetch(episodeUrl, { method: "GET" });
    const html = await response.text();
    const disqusConfigMatch = html.match(
      /var disqus_config = function \(\) \{([\s\S]+?)\};/
    );

    if (disqusConfigMatch && disqusConfigMatch[1]) {
      const pageUrlMatch = disqusConfigMatch[1].match(
        /this\.page\.url = '(.+?)';/
      );
      const pageIdentifierMatch = disqusConfigMatch[1].match(
        /this\.page\.identifier = '(.+?)';/
      );

      if (pageUrlMatch && pageIdentifierMatch) {
        return {
          pageUrl: pageUrlMatch[1],
          pageIdentifier: pageIdentifierMatch[1],
        };
      }
    }
  } catch (error) {
    console.error("Error al obtener la configuración de Disqus:", error);
  }
  return null;
}

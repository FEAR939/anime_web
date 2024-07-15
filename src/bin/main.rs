use std::{
    fs, io::{self, prelude::*}, net::{TcpListener, TcpStream}
};
use anime_web::ThreadPool;
use reqwest;

type RouteHandler = fn(&[u8]) -> (String, Vec<u8>);

// Function to create our routes
fn create_routes() -> Vec<(Vec<u8>, RouteHandler)> {
    vec![
        // Home page
        (b"GET / HTTP/1.1\r\n".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: text/html"), 
             fs::read("public/home/index.html").unwrap())
        }),
        (b"GET /public/home/styles.css HTTP/1.1\r\n".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: text/css"), 
             fs::read("public/home/styles.css").unwrap())
        }),
        (b"GET /public/home/script.js HTTP/1.1\r\n".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: application/javascript"), 
             fs::read("public/home/script.js").unwrap())
        }),
        // Search page
        (b"GET /search HTTP/1.1\r\n".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: text/html"), 
             fs::read("public/search/index.html").unwrap())
        }),
        (b"GET /public/search/script.js HTTP/1.1\r\n".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: application/javascript"), 
             fs::read("public/search/script.js").unwrap())
        }),
        // Watch page
        (b"GET /watch".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: text/html"), 
             fs::read("public/watch/index.html").unwrap())
        }),
        (b"GET /public/watch/script.js".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: application/javascript"), 
             fs::read("public/watch/script.js").unwrap())
        }),
        // CORS fetch
        (b"POST /cors-fetch HTTP/1.1\r\n".to_vec(), |buffer| {
            let request_str = std::str::from_utf8(buffer).unwrap();
            let lines: Vec<&str> = request_str.lines().collect();
            let mut collect = false;
            let mut body = String::new();
            for line in lines {
                if collect {
                    body.push_str(line);
                }
                if line.is_empty() {
                    collect = true;
                }
            }
            (format!("HTTP/1.1 200 OK\r\nContent-Type: application/json"), 
             handle_fetch(body).into_bytes())
        }),

        // pngs
        (b"GET /public/icons8-search.png HTTP/1.1\r\n".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: image/png"), 
             fs::read("public/icons8-search.png").unwrap())
        }),
        (b"GET /public/icons8-arrowleft.png HTTP/1.1\r\n".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: image/png"), 
             fs::read("public/icons8-arrowleft.png").unwrap())
        }),
        (b"GET /public/icons8-star.png HTTP/1.1\r\n".to_vec(), |_| {
            (format!("HTTP/1.1 200 OK\r\nContent-Type: image/png"), 
             fs::read("public/icons8-star.png").unwrap())
        })
    ]
}

fn main() {
    let listener = TcpListener::bind("0.0.0.0:80").unwrap();

    let pool = ThreadPool::new(30);

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                pool.execute(|| {
                    if let Err(e) = handle_connection(stream) {
                        eprint!("Error handling connection: {}", e);
                    }
                });
            }
            Err(e) => {
                println!("Error: {}", e);
            }     
        }
    }
}

fn handle_request(buffer: &[u8]) -> (String, Vec<u8>) {
    let routes = create_routes();

    for (prefix, handler) in routes.iter() {
        if buffer.starts_with(prefix) {
            return handler(buffer);
        }
    }

    // If no route matches, return 404
    (format!("HTTP/1.1 404 NOT FOUND"), fs::read("public/404/index.html").unwrap())
}

fn handle_connection(mut stream: TcpStream) -> io::Result<()> {
    let mut buffer = [0; 1024];
    
    // Read from the stream
    let size = match stream.read(&mut buffer) {
        Ok(size) => size,
        Err(e) => {
            eprintln!("Error reading from stream: {}", e);
            return Ok(()); // Return early, but don't panic
        }
    };

    // Handle the request
    let (status_line, content) = handle_request(&buffer[..size]);
    
    let response = format!(
        "{}\r\nContent-Length: {}\r\n\r\n",
        status_line,
        content.len()
    );
    
    let mut response = response.into_bytes();
    response.extend_from_slice(&content);
    
    // Write the response, handling potential errors
    if let Err(e) = stream.write_all(&response) {
        eprintln!("Error writing to stream: {}", e);
        return Ok(()); // Return early, but don't panic
    }

    // Flush the stream, handling potential errors
    if let Err(e) = stream.flush() {
        eprintln!("Error flushing stream: {}", e);
        return Ok(()); // Return early, but don't panic
    }

    Ok(())
}

fn handle_fetch(body: String) -> String {
    let client = reqwest::blocking::Client::new();

    let result = if body.starts_with("GET") {
        let url = &body[4..];
        let fetch = client.get(url).send().unwrap();
        let response = fetch.text().unwrap();
        response
    } 
    else if body.starts_with("POST") {
        let request = body.split(" ").collect::<Vec<&str>>();
        let query = request[1].to_string();
        let url = request[2].to_string();
        
        let fetch = client.post(url)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(query.to_string())
        .send()
        .unwrap();

        let response = fetch.text().unwrap();
        response
    } 
    else {
        String::from("")
    };

    return result;
}
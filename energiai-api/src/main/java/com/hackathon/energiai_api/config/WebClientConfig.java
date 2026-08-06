package com.hackathon.energiai_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

    @Value("${modelo-api.url:http://modelo-api:8000}")
    private String modeloApiUrl;

    @Value("${modelo-api.connect-timeout:5000}")
    private int connectTimeoutMs;

    @Value("${modelo-api.read-timeout:10000}")
    private int readTimeoutMs;

    @Value("${modelo-api.write-timeout:10000}")
    private int writeTimeoutMs;

    @Bean
    public WebClient modeloApiWebClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeoutMs)
                .responseTimeout(Duration.ofMillis(readTimeoutMs))
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(readTimeoutMs, TimeUnit.MILLISECONDS))
                            .addHandlerLast(new WriteTimeoutHandler(writeTimeoutMs, TimeUnit.MILLISECONDS)));

        return WebClient.builder()
                .baseUrl(modeloApiUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
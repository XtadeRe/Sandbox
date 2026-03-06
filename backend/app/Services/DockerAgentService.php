<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class DockerAgentService
{
    // Адрес где работает Docker Agent
    protected $agentUrl;

    // Конструктор - просто запоминаем адрес агента
    public function __construct($agentUrl)
    {
        $this->agentUrl = $agentUrl;
    }

    // Проверить жив ли агент
    public function ping()
    {
        $response = Http::get($this->agentUrl . '/api/health');
        return $response->json();
    }

    // Получить список всех контейнеров
    public function getContainers()
    {
        $response = Http::get($this->agentUrl . '/api/containers');
        return $response->json();
    }

    // Перезапустить контейнер
    public function restartContainer($containerId)
    {
        $response = Http::post($this->agentUrl . '/api/containers/' . $containerId . '/restart');
        return $response->json();
    }

    // Остановить контейнер
    public function stopContainer($containerId)
    {
        $response = Http::post($this->agentUrl . '/api/containers/' . $containerId . '/stop');
        return $response->json();
    }

    // Запустить контейнер
    public function startContainer($containerId)
    {
        $response = Http::post($this->agentUrl . '/api/containers/' . $containerId . '/start');
        return $response->json();
    }

    // Получить логи контейнера
    public function getLogs($containerId)
    {
        $response = Http::get($this->agentUrl . '/api/containers/' . $containerId . '/logs');
        return $response->json();
    }

    // Запустить новый стек (docker-compose)
    public function startStack($name, $composeFile = null)
    {
        $response = Http::post($this->agentUrl . '/api/stacks/' . $name . '/up', [
            'composeFile' => $composeFile
        ]);
        return $response->json();
    }

    // Остановить стек
    public function stopStack($name)
    {
        $response = Http::post($this->agentUrl . '/api/stacks/' . $name . '/down');
        return $response->json();
    }
}

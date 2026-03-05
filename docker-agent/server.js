const express = require('express');
const Docker = require('dockerode');
const cors = require('cors');
const morgan = require('morgan');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

const app = express();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Проверка доступности агента
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        docker: 'connected'
    });
});

// Получение списка всех контейнеров
app.get('/api/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        const formattedContainers = containers.map(container => ({
            id: container.Id.substring(0, 12),
            name: container.Names[0].replace('/', ''),
            image: container.Image,
            state: container.State,
            status: container.Status,
            created: new Date(container.Created * 1000).toISOString(),
            labels: container.Labels
        }));
        res.json(formattedContainers);
    } catch (error) {
        console.error('Error getting containers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получение информации о конкретном контейнере
app.get('/api/containers/:id', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        const info = await container.inspect();
        res.json({
            id: info.Id.substring(0, 12),
            name: info.Name.replace('/', ''),
            state: info.State.Status,
            image: info.Config.Image,
            created: info.Created,
            config: info.Config,
            network: info.NetworkSettings
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Запуск стека (docker-compose up)
app.post('/api/stacks/:name/up', async (req, res) => {
    try {
        const { composeFile, envVars } = req.body;

        // Создаем временную папку для стека
        const stackDir = `/tmp/stacks/${req.params.name}`;
        await execPromise(`mkdir -p ${stackDir}`);

        // Сохраняем docker-compose.yml
        if (composeFile) {
            await execPromise(`echo '${composeFile}' > ${stackDir}/docker-compose.yml`);
        }

        // Запускаем стек
        const { stdout, stderr } = await execPromise(
            `cd ${stackDir} && docker-compose -p ${req.params.name} up -d`,
            { env: { ...process.env, ...envVars } }
        );

        res.json({
            message: 'Stack started successfully',
            output: stdout,
            error: stderr
        });
    } catch (error) {
        console.error('Error starting stack:', error);
        res.status(500).json({ error: error.message });
    }
});

// Остановка стека
app.post('/api/stacks/:name/down', async (req, res) => {
    try {
        const stackDir = `/tmp/stacks/${req.params.name}`;
        const { stdout, stderr } = await execPromise(
            `cd ${stackDir} && docker-compose -p ${req.params.name} down`
        );

        // Удаляем временную папку
        await execPromise(`rm -rf ${stackDir}`);

        res.json({
            message: 'Stack stopped successfully',
            output: stdout,
            error: stderr
        });
    } catch (error) {
        console.error('Error stopping stack:', error);
        res.status(500).json({ error: error.message });
    }
});

// Перезапуск контейнера
app.post('/api/containers/:id/restart', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.restart();
        res.json({ message: 'Container restarted successfully' });
    } catch (error) {
        console.error('Error restarting container:', error);
        res.status(500).json({ error: error.message });
    }
});

// Остановка контейнера
app.post('/api/containers/:id/stop', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.stop();
        res.json({ message: 'Container stopped successfully' });
    } catch (error) {
        console.error('Error stopping container:', error);
        res.status(500).json({ error: error.message });
    }
});

// Запуск контейнера
app.post('/api/containers/:id/start', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.start();
        res.json({ message: 'Container started successfully' });
    } catch (error) {
        console.error('Error starting container:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получение логов контейнера
app.get('/api/containers/:id/logs', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail: 100
        });
        res.json({ logs: logs.toString() });
    } catch (error) {
        console.error('Error getting logs:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Docker Agent running on port ${PORT}`);
    console.log(`📡 Docker socket: /var/run/docker.sock`);
});
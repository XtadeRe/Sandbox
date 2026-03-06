<?php

use App\Http\Controllers\DockerTestController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/docker/test', [DockerTestController::class, 'test']);
Route::post('/docker/restart/{id}', [DockerTestController::class, 'restart']);

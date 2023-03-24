<script>
    import { user } from "../user-store.js"
    import { Link, navigate } from "svelte-routing"
    import Loader from "./Loader.svelte"

    let loading = false
    let username = ""
    let password = ""
    let error = ""

    async function login(){
        error = ""
        loading = true

        const response = await fetch("http://localhost:8080/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        })

        const body = await response.json()

        switch (response.status) {
            case 500:
                loading = false
                error = "Something went wrong"
                break
            case 400:
                loading = false

                switch (body.error) {
                    case "invalid_grant":
                        error = "Incorrect username or password"
                        break
                    case "unsupported_grant_type":
                        error = "Unsupported grant type"
                        break
                }
                break
            case 200:
                $user = {
                    isLoggedIn: true,
                    accessToken: body.access_token,
                    userID: body.userID
                }
                navigate("/")
        }
        
    }
</script>

<img class="logo" src="/NotifyUs_Logo.png" alt="logo">

<h1 class="inline-header">Notify . Us</h1>
<p>Get organized with your friends and colleagues</p>

<h1 class="top-margin">Login</h1>

{#if loading}
    <Loader/>
{/if}
<p class="error-text">{error}</p>

<form on:submit|preventDefault={login}>

    <div>
        <label for="username">Username: </label>
        <input type="text" name="username" bind:value={username}>
    </div>

    <div>
        <label for="password">Password: </label>
        <input type="password" name="password" bind:value={password}>
    </div>

    <button type="submit" class="submit-button">Login</button>

</form>

<p>Don't have an account? <Link to="signup">Sign up!</Link></p>

<style>
    .top-margin {
        margin-top: 1.5em;
    }
    .logo {
        height: 100px;
        width: 100px;
    }
    .inline-header {
        display: inline-block;
        vertical-align: top;
        margin: 0.5em 0 0 0.2em
    }
    input {
        width: 19.1em;
        padding: 8px 14px;
        margin: 8px 0;
        box-sizing: border-box;
    }
    .error-text {
        color: red
    }
    .submit-button {
        margin-top: 0.5em;
    }
</style>
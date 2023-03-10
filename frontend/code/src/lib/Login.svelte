<script>
    import { user } from "../user-store.js"
    import { Link, navigate } from "svelte-routing"

    let loading = false
    let username = ""
    let password = ""
    let error = ""

    async function login(){
        error = ""
        loading = true

        const data = {
            //TODO: use grant_type in backend
            grant_type: 'password',
            username: username,
            password: password
        }

        const response = await fetch("http://localhost:8080/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })

        const body = await response.json()

        switch (response.status) {
            case 400:
                loading = false
                error = body.error
                return
            case 200:
                $user = {
                    isLoggedIn: true,
                    accessToken: "",
                }
                navigate("/")
        }
        //TODO: add accessToken
        
    }
</script>

<h1>Login</h1>

{#if loading}
    <div class="loader"></div>
{/if}
<p class="error-text">{error}</p>

<form on:submit|preventDefault={login}>

    <div>
        Username:
        <input type="text" bind:value={username}>
    </div>

    <div>
        Password:
        <input type="password" bind:value={password}>
    </div>

    <input type="submit" value="Login">

</form>

<p>Don't have an account? <Link to="signup">Sign up!</Link></p>

<style>
    .error-text {
        color: red
    }
    .loader {
        border: 8px solid #dadada;
        border-top: 8px solid #6d6d6d;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 2s linear infinite;
        margin-left: auto;
        margin-right: auto;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
<script>
    import { user } from "../user-store.js"
    import { navigate } from "svelte-routing"
    import Loader from "./Loader.svelte"

    const fetchUserPromise = fetch("http://localhost:8080/user/get", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })
    
    let loading = false
    let showImageForm = false
    let imageHadError = false
    let imageMessage = ""

    let showPasswordForm = false
    let passwordHadError = false
    let passwordMessage = ""

    let oldPassword = ""
    let newPassword = ""
    let confPassword = ""

    let fileInput
    let files
    let avatar

    function getBase64(image) {
        const reader = new FileReader()
        reader.readAsDataURL(image)
        reader.onload = e => {
            avatar = e.target.result
        }
    }

    async function updateAvatar() {
        imageMessage = ""
        loading = true

        if (avatar) {
            const data = {
                imageData: avatar
            }

            const response = await fetch("http://localhost:8080/user/avatar", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer "+$user.accessToken,
                },
                body: JSON.stringify(data)
            })

            if (response.status == 200) {
                imageHadError = false
                imageMessage = "Avatar updated!"

            } else {
                const body = await response.json()
                imageHadError = true
                imageMessage = body.error
            }

        } else {
            imageHadError = true
            imageMessage = "No image selected"
        }
        
        loading = false
    }

    async function updatePassword() {
        passwordMessage = ""
        loading = true

        const data = {
            newPw: newPassword,
            oldPw: oldPassword,
            confPw: confPassword,
        }

        const response = await fetch("http://localhost:8080/user/password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+$user.accessToken,
            },
            body: JSON.stringify(data)
        })

        if (response.status == 200) {
            passwordHadError = false
            passwordMessage = "Password updated!"

            newPassword = oldPassword = confPassword = ""

        } else {
            const body = await response.json()
            passwordHadError = true
            passwordMessage = body.error
        }

        loading = false
    }

    function logout() {
        $user = {
            isLoggedIn: false,
            accessToken: "",
        }
        navigate("/login")
    }
</script>

{#await fetchUserPromise}

    <Loader/>

{:then response}

    {#await response.json() then response}
    
        <h1>{response.username}</h1>

        <div>
            {#if avatar}
                <img class="avatar" src={avatar} alt="uploaded avatar"/>
            {:else if response.profileImage == ""}
                <img class="avatar" src="/userAvatar.png" alt="placeholder avatar"/>
            {:else}
            <img src={response.profileImage} class="avatar" alt="user Avatar">
            {/if}
        </div>

        <section class="dropdown">
            <button class="menu-button" on:click={() => showImageForm = !showImageForm}>Edit Avatar</button>

            <div class:show={showImageForm} class="dropdown-content">
                {#if loading}
                    <Loader/>
                {/if}
                <p class:error-text={imageHadError}>{imageMessage}</p>
                <form on:submit|preventDefault={updateAvatar}>
                    <input type="file" accept="image/jpeg, image/png" bind:files bind:this={fileInput} on:change={() => getBase64(files[0])}/>
                    <button type="submit" class="submit-button">Update</button>
                </form>
            </div>
        </section>

        <div>
            <section class="dropdown">
                <button class="menu-button" on:click={() => showPasswordForm = !showPasswordForm}>Change Password</button>

                <div class:show={showPasswordForm} class="dropdown-content">
                    <p class:error-text={passwordHadError}>{passwordMessage}</p>
                    <form on:submit|preventDefault={updatePassword}>
                        <div>
                            <label for="oldPassword">Old password: </label>
                            <input type="password" name="oldPassword" bind:value={oldPassword}>
                        </div>

                        <div>
                            <label for="newPassword">New password: </label>
                            <input type="password" name="newPassword" bind:value={newPassword}>
                        </div>

                        <div>
                            <label for="confPassword">confirm new password: </label>
                            <input type="password" name="confPassword" bind:value={confPassword}>
                        </div>

                        <button type="submit" class="submit-button">Update</button>
                    </form>
                </div>
            </section>
        </div>

        <div>
            <button class="menu-button" on:click={logout}>Log out</button>
        </div>

    {/await}

{:catch error}
    {console.log(error)}
    <p>Something went wrong, try again later.</p>

{/await}

<style>
    .error-text {
        color: red;
        margin: 0.5em;
    }
    button {
        margin: 1.2em;
    }
    .menu-button {
        margin-bottom: 0em;
    }
    input[type=password] {
        width: 19.1em;
        padding: 8px 14px;
        margin: 8px 0;
        box-sizing: border-box;
    }
    .avatar {
        object-fit: cover;
        border: 3px solid #213547;
        border-radius: 50%;
        height: 100px;
        width: 100px;
    }
    .dropdown {
        position: relative;
        display: inline-block;
    }  
    .dropdown-content {
        display: none;
        background-color: #92A1B3;
        border: 1px solid #ddd;
    }
    .show {
        display: block;
    }
</style>
import { expect } from "chai";
import { ethers, deployments, getNamedAccounts } from "hardhat";
import type { MusicShop } from "../typechain-types";

describe("MusicShop", function () {
  let deployer: string;
  let user: string;
  let musicShop: MusicShop;
  let musicShopAsUser: MusicShop;

  async function addAlbum() {
    const tx = await musicShop.addAlbum("test.42", "Demo", 100, 5);
    await tx.wait();
  }

  beforeEach(async function () {
    await deployments.fixture(["MusicShop"]);

    ({ deployer, user } = await getNamedAccounts());

    musicShop = await ethers.getContract<MusicShop>("MusicShop");

    musicShopAsUser = await ethers.getContract<MusicShop>("MusicShop", user);
  });

  it("Sets owner", async function () {
    expect(await musicShop.owner()).to.eq(deployer);
  });

  // it("Doesn't accept funds via receive ", async function () {
  //   const txData = {
  //     value: 100,
  //     to: musicShop.address
  //   };

  //   const signer = await ethers.getSigner(deployer);
  //   const tx = await signer.sendTransaction(txData);
  //   await tx.wait();
  //   console.log(tx);
  // });

  describe("addAlbum()", function () {
    it("Allows owner to add album", async function () {
      await addAlbum();

      const newAlbum = await musicShop.albums(0);

      expect(newAlbum.uid).to.eq("test.42");
      expect(newAlbum.title).to.eq("Demo");
      expect(newAlbum.price).to.eq(100);
      expect(newAlbum.quantity).to.eq(5);
      expect(newAlbum.index).to.eq(0);

      expect(await musicShop.currentIndex()).to.eq(1);
    });

    it("Doesn't allow other users to add albums", async function () {
      await expect(
        musicShopAsUser.addAlbum("test.42", "Demo", 100, 5)
      ).to.be.revertedWith("not an owner");
    });
  });

  describe("buy()", function () {
    it("Allows to buy an album", async function () {
      await addAlbum();

      const tx = await musicShopAsUser.buy(0, { value: 100 });
      await tx.wait();

      const album = await musicShopAsUser.albums(0);
      expect(album.quantity).to.eq(4);

      const order = await musicShopAsUser.orders(0);
      expect(order.orderId).to.eq(0);
      expect(order.albumUid).to.eq(album.uid);
      expect(order.customer).to.eq(user);
      expect(order.status).to.eq(0);

      const ts = (await ethers.provider.getBlock(<number>tx.blockNumber))
        .timestamp;
      expect(order.orderedAt).to.eq(ts);

      await expect(tx)
        .to.emit(musicShopAsUser, "AlbumBought")
        .withArgs(order.albumUid, order.albumUid, user, ts);
      
      await expect(tx).to.changeEtherBalance(musicShopAsUser, 100);
    });
  });
});
